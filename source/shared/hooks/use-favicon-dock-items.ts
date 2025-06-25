import { useCallback, useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type {
  AddFaviconDockItemRequest,
  AddFaviconDockItemResponse
} from "~background/messages/add-favicon-dock-item"
import type {
  GetFaviconDockItemsRequest,
  GetFaviconDockItemsResponse
} from "~background/messages/get-favicon-dock-items"
import type {
  RemoveFaviconDockItemRequest,
  RemoveFaviconDockItemResponse
} from "~background/messages/remove-favicon-dock-item"
import type {
  UpdateFaviconDockItemsRequest,
  UpdateFaviconDockItemsResponse
} from "~background/messages/update-favicon-dock-items"

import type { FaviconDockItem } from "../utils/favicon-dock-items"

export interface UseFaviconDockItemsReturn {
  // 状态
  items: FaviconDockItem[]
  loading: boolean
  error: string | null

  // 操作
  addItem: (
    request: Omit<AddFaviconDockItemRequest, "tabId"> & { tabId?: number }
  ) => Promise<boolean>
  removeItem: (id: string) => Promise<boolean>
  updateItem: (
    id: string,
    updates: Partial<FaviconDockItem>
  ) => Promise<boolean>
  reorderItems: (itemIds: string[]) => Promise<boolean>
  updateLastUsed: (id: string) => Promise<boolean>
  refreshItems: () => Promise<void>

  // 辅助方法
  getItemByUrl: (url: string) => FaviconDockItem | undefined
  hasItem: (url: string) => boolean
}

/**
 * Favicon Dock Items Hook
 *
 * 功能：
 * - 管理 favicon dock 项目的状态
 * - 提供增删改查操作
 * - 自动处理加载状态和错误
 * - 支持实时更新
 */
export function useFaviconDockItems(): UseFaviconDockItemsReturn {
  const [items, setItems] = useState<FaviconDockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取所有项目
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await sendToBackground<
        GetFaviconDockItemsRequest,
        GetFaviconDockItemsResponse
      >({
        name: "get-favicon-dock-items",
        body: {}
      })

      if (response.success && response.items) {
        setItems(response.items)
      } else {
        throw new Error(response.error || "获取项目失败")
      }
    } catch (err) {
      console.error("[useFaviconDockItems] 获取项目失败:", err)
      setError(err instanceof Error ? err.message : "获取项目失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 添加新项目
  const addItem = useCallback(
    async (
      request: Omit<AddFaviconDockItemRequest, "tabId"> & { tabId?: number }
    ): Promise<boolean> => {
      try {
        setError(null)

        const response = await sendToBackground<
          AddFaviconDockItemRequest,
          AddFaviconDockItemResponse
        >({
          name: "add-favicon-dock-item",
          body: request
        })

        if (response.success && response.item) {
          // 添加到本地状态
          setItems((prev) =>
            [...prev, response.item!].sort((a, b) => a.order - b.order)
          )
          return true
        } else {
          throw new Error(response.error || "添加项目失败")
        }
      } catch (err) {
        console.error("[useFaviconDockItems] 添加项目失败:", err)
        setError(err instanceof Error ? err.message : "添加项目失败")
        return false
      }
    },
    []
  )

  // 删除项目
  const removeItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await sendToBackground<
        RemoveFaviconDockItemRequest,
        RemoveFaviconDockItemResponse
      >({
        name: "remove-favicon-dock-item",
        body: { id }
      })

      if (response.success) {
        // 从本地状态中移除
        setItems((prev) => prev.filter((item) => item.id !== id))
        return true
      } else {
        throw new Error(response.error || "删除项目失败")
      }
    } catch (err) {
      console.error("[useFaviconDockItems] 删除项目失败:", err)
      setError(err instanceof Error ? err.message : "删除项目失败")
      return false
    }
  }, [])

  // 更新项目
  const updateItem = useCallback(
    async (id: string, updates: Partial<FaviconDockItem>): Promise<boolean> => {
      try {
        setError(null)

        const response = await sendToBackground<
          UpdateFaviconDockItemsRequest,
          UpdateFaviconDockItemsResponse
        >({
          name: "update-favicon-dock-items",
          body: {
            action: "update",
            id,
            updates
          }
        })

        if (response.success) {
          // 更新本地状态
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            )
          )
          return true
        } else {
          throw new Error(response.error || "更新项目失败")
        }
      } catch (err) {
        console.error("[useFaviconDockItems] 更新项目失败:", err)
        setError(err instanceof Error ? err.message : "更新项目失败")
        return false
      }
    },
    []
  )

  // 重新排序
  const reorderItems = useCallback(
    async (itemIds: string[]): Promise<boolean> => {
      try {
        setError(null)

        const response = await sendToBackground<
          UpdateFaviconDockItemsRequest,
          UpdateFaviconDockItemsResponse
        >({
          name: "update-favicon-dock-items",
          body: {
            action: "reorder",
            itemIds
          }
        })

        if (response.success) {
          // 重新排序本地状态
          setItems((prev) => {
            const itemMap = new Map(prev.map((item) => [item.id, item]))
            return itemIds
              .map((id, index) => ({
                ...itemMap.get(id)!,
                order: index
              }))
              .filter(Boolean)
          })
          return true
        } else {
          throw new Error(response.error || "重新排序失败")
        }
      } catch (err) {
        console.error("[useFaviconDockItems] 重新排序失败:", err)
        setError(err instanceof Error ? err.message : "重新排序失败")
        return false
      }
    },
    []
  )

  // 更新最后使用时间
  const updateLastUsed = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await sendToBackground<
        UpdateFaviconDockItemsRequest,
        UpdateFaviconDockItemsResponse
      >({
        name: "update-favicon-dock-items",
        body: {
          action: "updateLastUsed",
          id
        }
      })

      if (response.success) {
        // 更新本地状态
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, lastUsed: Date.now() } : item
          )
        )
        return true
      } else {
        console.warn("[useFaviconDockItems] 更新使用时间失败:", response.error)
        return false
      }
    } catch (err) {
      console.error("[useFaviconDockItems] 更新使用时间失败:", err)
      return false
    }
  }, [])

  // 刷新项目列表
  const refreshItems = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  // 根据 URL 查找项目
  const getItemByUrl = useCallback(
    (url: string): FaviconDockItem | undefined => {
      return items.find((item) => item.url === url)
    },
    [items]
  )

  // 检查是否存在某个 URL
  const hasItem = useCallback(
    (url: string): boolean => {
      return items.some((item) => item.url === url)
    },
    [items]
  )

  // 初始化时获取项目
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return {
    // 状态
    items,
    loading,
    error,

    // 操作
    addItem,
    removeItem,
    updateItem,
    reorderItems,
    updateLastUsed,
    refreshItems,

    // 辅助方法
    getItemByUrl,
    hasItem
  }
}
