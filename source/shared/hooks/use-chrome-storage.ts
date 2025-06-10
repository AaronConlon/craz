import { useEffect, useState } from "react"

export interface FaviconBookmark {
  id: string
  title: string
  url: string
  favIconUrl?: string // 运行时从 IndexedDB 加载
  order: number
}

export interface StoredBookmark {
  id: string
  title: string
  url: string
  order: number
  // 注意：不包含 favIconUrl，避免 Chrome Storage 配额问题
}

/**
 * Chrome Storage Sync Hook
 * 用于管理固定的 favicon 书签，通过 Google 账户自动同步
 */
export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 从 Chrome storage 读取数据
    const loadFromStorage = async () => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.sync) {
          const result = await chrome.storage.sync.get(key)
          if (result[key] !== undefined) {
            setValue(result[key])
          }
        }
      } catch (err) {
        console.error("Failed to load from chrome storage:", err)
        setError(err instanceof Error ? err.message : "Storage error")
      } finally {
        setLoading(false)
      }
    }

    loadFromStorage()

    // 监听 storage 变化
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      if (changes[key]) {
        setValue(changes[key].newValue || defaultValue)
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange)

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange)
      }
    }
  }, [key, defaultValue])

  // 更新存储
  const updateValue = async (newValue: T) => {
    try {
      setValue(newValue)
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        await chrome.storage.sync.set({ [key]: newValue })
      }
    } catch (err) {
      console.error("Failed to save to chrome storage:", err)
      setError(err instanceof Error ? err.message : "Storage error")
    }
  }

  return {
    value,
    setValue: updateValue,
    loading,
    error
  }
}

/**
 * 专门用于管理固定 favicon 书签的 hook
 * 策略：Chrome Storage Sync 只保存基本信息，favicon 数据存储在 IndexedDB
 */
export function useFaviconBookmarks() {
  const defaultStoredBookmarks: StoredBookmark[] = []

  const {
    value: storedBookmarks,
    setValue: setStoredBookmarks,
    loading: storageLoading,
    error: storageError
  } = useChromeStorage<StoredBookmark[]>(
    "fixedFaviconBookmarks",
    defaultStoredBookmarks
  )

  const [bookmarks, setBookmarks] = useState<FaviconBookmark[]>([])
  const [faviconLoading, setFaviconLoading] = useState(false)

  // 当存储的书签变化时，加载 favicon 数据
  useEffect(() => {
    const loadFavicons = async () => {
      setFaviconLoading(true)

      try {
        if (storedBookmarks.length === 0) {
          // 没有书签数据时，设置为空数组并完成加载
          setBookmarks([])
          return
        }

        const { getFaviconCache } = await import("../utils/indexdb-utils")

        const bookmarksWithFavicons = await Promise.all(
          storedBookmarks.map(async (bookmark) => {
            const faviconCacheKey = await getFaviconCache(bookmark.url)
            let favIconUrl: string | undefined

            if (faviconCacheKey) {
              // 解析缓存键：时间戳____base64
              const base64 = faviconCacheKey.split("____")[1]
              if (base64) {
                favIconUrl = `data:image/png;base64,${base64}`
              }
            }

            return {
              ...bookmark,
              favIconUrl
            } as FaviconBookmark
          })
        )

        setBookmarks(bookmarksWithFavicons.sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error("Failed to load favicons:", error)
        // 如果加载 favicon 失败，至少显示书签基本信息
        setBookmarks(
          storedBookmarks.map((bookmark) => ({
            ...bookmark,
            favIconUrl: undefined
          }))
        )
      } finally {
        setFaviconLoading(false)
      }
    }

    loadFavicons()
  }, [storedBookmarks])

  const addBookmark = async (
    bookmark: Omit<FaviconBookmark, "id" | "order">
  ) => {
    const newStoredBookmark: StoredBookmark = {
      id: Date.now().toString(),
      title: bookmark.title,
      url: bookmark.url,
      order: storedBookmarks.length
    }

    // 保存到 Chrome Storage (不包含 favicon)
    await setStoredBookmarks([...storedBookmarks, newStoredBookmark])

    // 如果有 favicon 数据，保存到 IndexedDB
    if (bookmark.favIconUrl?.startsWith("data:image/")) {
      try {
        const { saveFaviconCache } = await import("../utils/indexdb-utils")
        const base64 = bookmark.favIconUrl.split(",")[1]
        if (base64) {
          await saveFaviconCache(bookmark.url, base64)
        }
      } catch (error) {
        console.error("Failed to save favicon to IndexedDB:", error)
      }
    }
  }

  const removeBookmark = async (id: string) => {
    const bookmarkToRemove = storedBookmarks.find((b) => b.id === id)
    const filtered = storedBookmarks.filter((b) => b.id !== id)
    await setStoredBookmarks(filtered)

    // 可选：从 IndexedDB 删除 favicon 缓存
    if (bookmarkToRemove) {
      try {
        const { deleteFaviconCache } = await import("../utils/indexdb-utils")
        await deleteFaviconCache(bookmarkToRemove.url)
      } catch (error) {
        console.error("Failed to delete favicon from IndexedDB:", error)
      }
    }
  }

  const updateBookmark = async (
    id: string,
    updates: Partial<FaviconBookmark>
  ) => {
    const currentBookmark = storedBookmarks.find((b) => b.id === id)
    if (!currentBookmark) return

    // 更新基本信息到 Chrome Storage
    const updatedStoredBookmark: StoredBookmark = {
      ...currentBookmark,
      title: updates.title || currentBookmark.title,
      url: updates.url || currentBookmark.url,
      order: updates.order !== undefined ? updates.order : currentBookmark.order
    }

    const updated = storedBookmarks.map((b) =>
      b.id === id ? updatedStoredBookmark : b
    )
    await setStoredBookmarks(updated)

    // 如果更新了 favicon，保存到 IndexedDB
    if (updates.favIconUrl?.startsWith("data:image/")) {
      try {
        const { saveFaviconCache } = await import("../utils/indexdb-utils")
        const base64 = updates.favIconUrl.split(",")[1]
        if (base64) {
          await saveFaviconCache(updatedStoredBookmark.url, base64)
        }
      } catch (error) {
        console.error("Failed to update favicon in IndexedDB:", error)
      }
    }
  }

  const reorderBookmarks = async (newOrder: FaviconBookmark[]) => {
    const reorderedStored = newOrder.map((bookmark, index) => ({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      order: index
    }))
    await setStoredBookmarks(reorderedStored)
  }

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    reorderBookmarks,
    loading: storageLoading || faviconLoading,
    error: storageError
  }
}
