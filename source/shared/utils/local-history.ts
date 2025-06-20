/**
 * LocalHistory - 基于 IndexedDB 的本地历史记录管理
 *
 * 功能：
 * - 记录标签页访问次数
 * - 统计网站访问频率
 * - 支持搜索和排序
 * - 自动清理过期数据
 */

const DB_NAME = "CrazLocalHistory"
const DB_VERSION = 1
const STORE_NAME = "visitHistory"

export interface VisitRecord {
  url: string // 页面 URL (主键)
  title: string // 页面标题
  domain: string // 域名
  visitCount: number // 访问次数
  lastVisitTime: number // 最后访问时间戳
  firstVisitTime: number // 首次访问时间戳
  favicon?: string // favicon URL
}

export interface VisitStats {
  totalVisits: number
  uniqueUrls: number
  topDomains: Array<{
    domain: string
    visitCount: number
    percentage: number
  }>
  recentVisits: VisitRecord[]
}

export class LocalHistory {
  private dbPromise: Promise<IDBDatabase>

  constructor() {
    this.dbPromise = this.initDB()
  }

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建访问历史存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "url" })

          // 创建索引
          store.createIndex("domain", "domain", { unique: false })
          store.createIndex("visitCount", "visitCount", { unique: false })
          store.createIndex("lastVisitTime", "lastVisitTime", { unique: false })
          store.createIndex("firstVisitTime", "firstVisitTime", {
            unique: false
          })
        }
      }
    })
  }

  /**
   * 提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, "")
    } catch {
      return "unknown"
    }
  }

  /**
   * 记录访问
   */
  async recordVisit(
    url: string,
    title: string,
    favicon?: string
  ): Promise<void> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      // 获取现有记录
      const existingRecord = await new Promise<VisitRecord | null>(
        (resolve, reject) => {
          const request = store.get(url)
          request.onsuccess = () => resolve(request.result || null)
          request.onerror = () => reject(request.error)
        }
      )

      const now = Date.now()
      const domain = this.extractDomain(url)

      let visitRecord: VisitRecord

      if (existingRecord) {
        // 更新现有记录
        visitRecord = {
          ...existingRecord,
          title, // 更新标题
          visitCount: existingRecord.visitCount + 1,
          lastVisitTime: now,
          favicon: favicon || existingRecord.favicon
        }
      } else {
        // 创建新记录
        visitRecord = {
          url,
          title,
          domain,
          visitCount: 1,
          lastVisitTime: now,
          firstVisitTime: now,
          favicon
        }
      }

      // 保存记录
      await new Promise<void>((resolve, reject) => {
        const request = store.put(visitRecord)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log(
        `[LocalHistory] 记录访问: ${url} (访问次数: ${visitRecord.visitCount})`
      )
    } catch (error) {
      console.error("[LocalHistory] 记录访问失败:", error)
    }
  }

  /**
   * 获取访问记录
   */
  async getVisitRecord(url: string): Promise<VisitRecord | null> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.get(url)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 获取访问记录失败:", error)
      return null
    }
  }

  /**
   * 获取最常访问的网站
   */
  async getMostVisited(limit: number = 10): Promise<VisitRecord[]> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("visitCount")

      return new Promise((resolve, reject) => {
        const records: VisitRecord[] = []
        const request = index.openCursor(null, "prev") // 降序

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor && records.length < limit) {
            records.push(cursor.value)
            cursor.continue()
          } else {
            resolve(records)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 获取最常访问网站失败:", error)
      return []
    }
  }

  /**
   * 获取最近访问的网站
   */
  async getRecentVisits(limit: number = 10): Promise<VisitRecord[]> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("lastVisitTime")

      return new Promise((resolve, reject) => {
        const records: VisitRecord[] = []
        const request = index.openCursor(null, "prev") // 降序

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor && records.length < limit) {
            records.push(cursor.value)
            cursor.continue()
          } else {
            resolve(records)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 获取最近访问失败:", error)
      return []
    }
  }

  /**
   * 搜索访问记录
   */
  async searchHistory(
    query: string,
    limit: number = 20
  ): Promise<VisitRecord[]> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve, reject) => {
        const records: VisitRecord[] = []
        const request = store.openCursor()

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const record = cursor.value as VisitRecord
            const searchText =
              `${record.title} ${record.url} ${record.domain}`.toLowerCase()

            if (searchText.includes(query.toLowerCase())) {
              records.push(record)
            }

            if (records.length < limit) {
              cursor.continue()
            } else {
              // 按访问次数排序
              records.sort((a, b) => b.visitCount - a.visitCount)
              resolve(records)
            }
          } else {
            // 按访问次数排序
            records.sort((a, b) => b.visitCount - a.visitCount)
            resolve(records)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 搜索历史记录失败:", error)
      return []
    }
  }

  /**
   * 获取访问统计
   */
  async getVisitStats(): Promise<VisitStats> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve, reject) => {
        const domainStats = new Map<string, number>()
        let totalVisits = 0
        let uniqueUrls = 0

        const request = store.openCursor()

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const record = cursor.value as VisitRecord
            totalVisits += record.visitCount
            uniqueUrls++

            // 统计域名访问次数
            const currentCount = domainStats.get(record.domain) || 0
            domainStats.set(record.domain, currentCount + record.visitCount)

            cursor.continue()
          } else {
            // 处理域名统计
            const topDomains = Array.from(domainStats.entries())
              .map(([domain, visitCount]) => ({
                domain,
                visitCount,
                percentage: Math.round((visitCount / totalVisits) * 100)
              }))
              .sort((a, b) => b.visitCount - a.visitCount)
              .slice(0, 10)

            // 获取最近访问
            this.getRecentVisits(10)
              .then((recentVisits) => {
                resolve({
                  totalVisits,
                  uniqueUrls,
                  topDomains,
                  recentVisits
                })
              })
              .catch(reject)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 获取访问统计失败:", error)
      return {
        totalVisits: 0,
        uniqueUrls: 0,
        topDomains: [],
        recentVisits: []
      }
    }
  }

  /**
   * 清理过期数据
   */
  async cleanExpiredData(daysToKeep: number = 90): Promise<number> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("lastVisitTime")

      const expiredTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      const range = IDBKeyRange.upperBound(expiredTime)

      return new Promise((resolve, reject) => {
        let deletedCount = 0
        const request = index.openCursor(range)

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            cursor.delete()
            deletedCount++
            cursor.continue()
          } else {
            console.log(`[LocalHistory] 清理了 ${deletedCount} 条过期记录`)
            resolve(deletedCount)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 清理过期数据失败:", error)
      return 0
    }
  }

  /**
   * 删除特定 URL 的记录
   */
  async deleteRecord(url: string): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.delete(url)
        request.onsuccess = () => {
          console.log(`[LocalHistory] 删除记录: ${url}`)
          resolve(true)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 删除记录失败:", error)
      return false
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => {
          console.log("[LocalHistory] 清空所有记录")
          resolve(true)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[LocalHistory] 清空记录失败:", error)
      return false
    }
  }
}

// 创建单例实例
export const localHistory = new LocalHistory()
