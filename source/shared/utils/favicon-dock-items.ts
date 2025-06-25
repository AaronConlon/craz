/**
 * FaviconDockItems - 基于 IndexedDB 的 Favicon Dock 项管理
 *
 * 功能：
 * - 管理用户固定在 dock 中的 favicon 项目
 * - 支持增删查操作
 * - 自动保存 favicon 和网站信息
 * - 支持排序和重新排列
 */

const DB_NAME = "CrazFaviconDock"
const DB_VERSION = 1
const STORE_NAME = "dockItems"

export interface FaviconDockItem {
  id: string // 唯一标识符
  url: string // 网站 URL
  title: string // 网站标题
  favicon: string // favicon base64 数据 (data:image/png;base64,...)
  order: number // 排序顺序
  addedAt: number // 添加时间戳
  lastUsed?: number // 最后使用时间
}

export interface AddDockItemRequest {
  url: string
  title: string
  favicon?: string // 可选，如果没有会尝试获取
}

export class FaviconDockItems {
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

        // 创建 dock items 存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })

          // 创建索引
          store.createIndex("url", "url", { unique: false })
          store.createIndex("order", "order", { unique: false })
          store.createIndex("addedAt", "addedAt", { unique: false })
          store.createIndex("lastUsed", "lastUsed", { unique: false })
        }
      }
    })
  }

  /**
   * 添加新的 dock 项目
   */
  async addItem(request: AddDockItemRequest): Promise<FaviconDockItem> {
    try {
      const db = await this.dbPromise

      // 检查是否已存在相同 URL
      const existing = await this.getItemByUrl(request.url)
      if (existing) {
        throw new Error(`URL 已存在: ${request.url}`)
      }

      // 获取当前最大的 order 值
      const maxOrder = await this.getMaxOrder()

      // 创建新项目
      const newItem: FaviconDockItem = {
        id: `dock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: request.url,
        title: request.title,
        favicon: request.favicon || "", // 如果没有提供，后续可以异步获取
        order: maxOrder + 1,
        addedAt: Date.now()
      }

      // 保存到数据库
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.add(newItem)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log("[FaviconDockItems] 添加新项目:", newItem)
      return newItem
    } catch (error) {
      console.error("[FaviconDockItems] 添加项目失败:", error)
      throw error
    }
  }

  /**
   * 删除 dock 项目
   */
  async removeItem(id: string): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const success = await new Promise<boolean>((resolve, reject) => {
        const request = store.delete(id)
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })

      if (success) {
        console.log("[FaviconDockItems] 删除项目:", id)
      }
      return success
    } catch (error) {
      console.error("[FaviconDockItems] 删除项目失败:", error)
      return false
    }
  }

  /**
   * 获取所有 dock 项目 (按 order 排序)
   */
  async getAllItems(): Promise<FaviconDockItem[]> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("order")

      const items = await new Promise<FaviconDockItem[]>((resolve, reject) => {
        const request = index.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      // 按 order 排序
      return items.sort((a, b) => a.order - b.order)
    } catch (error) {
      console.error("[FaviconDockItems] 获取所有项目失败:", error)
      return []
    }
  }

  /**
   * 根据 URL 查找项目
   */
  async getItemByUrl(url: string): Promise<FaviconDockItem | null> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("url")

      const item = await new Promise<FaviconDockItem | null>(
        (resolve, reject) => {
          const request = index.get(url)
          request.onsuccess = () => resolve(request.result || null)
          request.onerror = () => reject(request.error)
        }
      )

      return item
    } catch (error) {
      console.error("[FaviconDockItems] 根据 URL 查找项目失败:", error)
      return null
    }
  }

  /**
   * 更新项目信息
   */
  async updateItem(
    id: string,
    updates: Partial<FaviconDockItem>
  ): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      // 先获取现有项目
      const existing = await new Promise<FaviconDockItem | null>(
        (resolve, reject) => {
          const request = store.get(id)
          request.onsuccess = () => resolve(request.result || null)
          request.onerror = () => reject(request.error)
        }
      )

      if (!existing) {
        console.warn("[FaviconDockItems] 要更新的项目不存在:", id)
        return false
      }

      // 合并更新
      const updatedItem: FaviconDockItem = {
        ...existing,
        ...updates,
        id: existing.id, // 确保 ID 不被更改
        addedAt: existing.addedAt // 确保添加时间不被更改
      }

      // 保存更新
      const success = await new Promise<boolean>((resolve, reject) => {
        const request = store.put(updatedItem)
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })

      if (success) {
        console.log("[FaviconDockItems] 更新项目:", id, updates)
      }
      return success
    } catch (error) {
      console.error("[FaviconDockItems] 更新项目失败:", error)
      return false
    }
  }

  /**
   * 重新排序项目
   */
  async reorderItems(itemIds: string[]): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      // 更新每个项目的 order
      for (let i = 0; i < itemIds.length; i++) {
        const id = itemIds[i]

        // 获取现有项目
        const existing = await new Promise<FaviconDockItem | null>(
          (resolve, reject) => {
            const request = store.get(id)
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(request.error)
          }
        )

        if (existing) {
          // 更新 order
          const updatedItem = { ...existing, order: i }
          await new Promise<void>((resolve, reject) => {
            const request = store.put(updatedItem)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      console.log("[FaviconDockItems] 重新排序完成:", itemIds)
      return true
    } catch (error) {
      console.error("[FaviconDockItems] 重新排序失败:", error)
      return false
    }
  }

  /**
   * 更新最后使用时间
   */
  async updateLastUsed(id: string): Promise<boolean> {
    return this.updateItem(id, { lastUsed: Date.now() })
  }

  /**
   * 获取当前最大的 order 值
   */
  private async getMaxOrder(): Promise<number> {
    try {
      const items = await this.getAllItems()
      if (items.length === 0) return 0
      return Math.max(...items.map((item) => item.order))
    } catch (error) {
      console.error("[FaviconDockItems] 获取最大 order 失败:", error)
      return 0
    }
  }

  /**
   * 清空所有项目 (慎用)
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log("[FaviconDockItems] 清空所有项目")
      return true
    } catch (error) {
      console.error("[FaviconDockItems] 清空失败:", error)
      return false
    }
  }

  /**
   * 获取项目数量
   */
  async getCount(): Promise<number> {
    try {
      const db = await this.dbPromise
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      return count
    } catch (error) {
      console.error("[FaviconDockItems] 获取数量失败:", error)
      return 0
    }
  }
}

// 导出单例实例
export const faviconDockItems = new FaviconDockItems()
