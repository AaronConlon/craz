/**
 * IndexedDB 工具函数 - Favicon 缓存
 */

const DB_NAME = "CrazFaviconCache"
const DB_VERSION = 1
const STORE_NAME = "favicons"

export interface FaviconCache {
  url: string // 原始 favicon URL
  timestamp: number // 缓存时间戳
  base64: string // base64 图片数据
  cacheKey: string // 缓存键："时间戳____base64"
  isDefault?: boolean // 是否为默认图标
}

/**
 * 初始化 IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "url" })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

/**
 * 保存 favicon 缓存
 */
export async function saveFaviconCache(
  url: string,
  base64: string
): Promise<void> {
  try {
    const db = await initDB()
    const timestamp = Date.now()
    const cacheKey = `${timestamp}____${base64}`

    const faviconCache: FaviconCache = {
      url,
      timestamp,
      base64,
      cacheKey
    }

    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(faviconCache)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log("[IndexedDB] Favicon cached:", url)
  } catch (error) {
    console.error("[IndexedDB] Failed to save favicon cache:", error)
  }
}

/**
 * 获取 favicon 缓存
 */
export async function getFaviconCache(url: string): Promise<string | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)

    const faviconCache = await new Promise<FaviconCache | null>(
      (resolve, reject) => {
        const request = store.get(url)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      }
    )

    if (!faviconCache) {
      return null
    }

    // 检查是否超过1天 (24小时)
    const oneDayMs = 24 * 60 * 60 * 1000
    const isExpired = Date.now() - faviconCache.timestamp > oneDayMs

    if (isExpired) {
      console.log("[IndexedDB] Favicon cache expired:", url)
      // 删除过期缓存
      await deleteFaviconCache(url)
      return null
    }

    console.log("[IndexedDB] Favicon cache hit:", url)
    return faviconCache.cacheKey
  } catch (error) {
    console.error("[IndexedDB] Failed to get favicon cache:", error)
    return null
  }
}

/**
 * 删除 favicon 缓存
 */
export async function deleteFaviconCache(url: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(url)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[IndexedDB] Failed to delete favicon cache:", error)
  }
}

/**
 * 清理所有过期的 favicon 缓存
 */
export async function cleanExpiredFaviconCache(): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    const oneDayMs = 24 * 60 * 60 * 1000
    const expiredTime = Date.now() - oneDayMs

    const index = store.index("timestamp")
    const range = IDBKeyRange.upperBound(expiredTime)

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })

    console.log("[IndexedDB] Cleaned expired favicon caches")
  } catch (error) {
    console.error("[IndexedDB] Failed to clean expired favicon cache:", error)
  }
}

/**
 * 检查是否为 base64 格式的图片
 */
export function isBase64Image(src: string): boolean {
  return src.startsWith("data:image/") && src.includes("base64,")
}
