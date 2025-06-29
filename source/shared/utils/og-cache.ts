import type { OgData } from "./og-parser"

interface OGData {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  type?: string
  siteName?: string
  locale?: string
  cachedAt: string
}

interface CachedOGData extends OGData {
  expiresAt: string
}

export class OGCache {
  private static readonly STORE_NAME = "og_cache"
  private static readonly DB_NAME = "craz_og_cache"
  private static readonly DB_VERSION = 1
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 1天的毫秒数

  /**
   * 初始化 IndexedDB
   */
  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "url" })
        }
      }
    })
  }

  /**
   * 写入缓存
   */
  public static async set(data: OGData): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(this.STORE_NAME, "readwrite")
    const store = tx.objectStore(this.STORE_NAME)

    const cachedData: CachedOGData = {
      ...data,
      expiresAt: new Date(Date.now() + this.CACHE_DURATION).toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(cachedData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      tx.oncomplete = () => db.close()
    })
  }

  /**
   * 读取缓存
   */
  public static async get(url: string): Promise<OGData | null> {
    const db = await this.getDB()
    const tx = db.transaction(this.STORE_NAME, "readwrite")
    const store = tx.objectStore(this.STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(url)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const data = request.result as CachedOGData | undefined

        if (!data) {
          resolve(null)
          return
        }

        // 检查是否过期
        if (new Date(data.expiresAt) < new Date()) {
          // 删除过期数据
          store.delete(url)
          resolve(null)
          return
        }

        // 返回缓存数据（不包含过期时间）
        const { expiresAt, ...ogData } = data
        resolve(ogData)
      }

      tx.oncomplete = () => db.close()
    })
  }

  /**
   * 清理过期缓存
   */
  public static async cleanup(): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(this.STORE_NAME, "readwrite")
    const store = tx.objectStore(this.STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const data = cursor.value as CachedOGData
          if (new Date(data.expiresAt) < new Date()) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      tx.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  }
}
