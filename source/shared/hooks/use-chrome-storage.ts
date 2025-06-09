import { useEffect, useState } from "react"

export interface FaviconBookmark {
  id: string
  title: string
  url: string
  favIconUrl?: string
  order: number
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
 */
export function useFaviconBookmarks() {
  const defaultBookmarks: FaviconBookmark[] = [
    { id: "1", title: "Google", url: "https://google.com", order: 0 },
    { id: "2", title: "GitHub", url: "https://github.com", order: 1 },
    {
      id: "3",
      title: "Stack Overflow",
      url: "https://stackoverflow.com",
      order: 2
    },
    { id: "4", title: "MDN", url: "https://developer.mozilla.org", order: 3 },
    { id: "5", title: "ChatGPT", url: "https://chat.openai.com", order: 4 }
  ]

  const {
    value: bookmarks,
    setValue: setBookmarks,
    loading,
    error
  } = useChromeStorage<FaviconBookmark[]>(
    "fixedFaviconBookmarks",
    defaultBookmarks
  )

  const addBookmark = async (
    bookmark: Omit<FaviconBookmark, "id" | "order">
  ) => {
    const newBookmark: FaviconBookmark = {
      ...bookmark,
      id: Date.now().toString(),
      order: bookmarks.length
    }
    await setBookmarks([...bookmarks, newBookmark])
  }

  const removeBookmark = async (id: string) => {
    const filtered = bookmarks.filter((b) => b.id !== id)
    await setBookmarks(filtered)
  }

  const updateBookmark = async (
    id: string,
    updates: Partial<FaviconBookmark>
  ) => {
    const updated = bookmarks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    )
    await setBookmarks(updated)
  }

  const reorderBookmarks = async (newOrder: FaviconBookmark[]) => {
    const reordered = newOrder.map((bookmark, index) => ({
      ...bookmark,
      order: index
    }))
    await setBookmarks(reordered)
  }

  return {
    bookmarks: bookmarks.sort((a, b) => a.order - b.order),
    addBookmark,
    removeBookmark,
    updateBookmark,
    reorderBookmarks,
    loading,
    error
  }
}
