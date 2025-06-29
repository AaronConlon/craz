import {
  useMutation,
  useQueryClient,
  useSuspenseQuery
} from "@tanstack/react-query"
import { useCallback } from "react"

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

// Query Key 常量
const FAVICON_DOCK_ITEMS_QUERY_KEY = ["favicon-dock-items"] as const

/**
 * Favicon Dock Items Hook
 *
 * 功能：
 * - 使用 useSuspenseQuery 管理 favicon dock 项目的状态
 * - 提供增删改查操作
 * - 自动处理加载状态和错误
 * - 操作成功后自动重新获取数据
 */
export function useFaviconDockItems(): UseFaviconDockItemsReturn {
  const queryClient = useQueryClient()

  // 使用 useSuspenseQuery 获取数据
  const { data: items } = useSuspenseQuery({
    queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY,
    queryFn: async (): Promise<FaviconDockItem[]> => {
      const response = await sendToBackground<
        GetFaviconDockItemsRequest,
        GetFaviconDockItemsResponse
      >({
        name: "get-favicon-dock-items",
        body: {}
      })

      console.log("[useFaviconDockItems] 获取项目:", response)

      if (response.success && response.items) {
        return response.items
      } else {
        throw new Error(response.error || "获取项目失败")
      }
    },
    staleTime: 1000 * 60 * 5 // 5分钟内数据有效
  })

  // 添加项目 mutation
  const addItemMutation = useMutation({
    mutationFn: async (
      request: Omit<AddFaviconDockItemRequest, "tabId"> & { tabId?: number }
    ): Promise<FaviconDockItem> => {
      const response = await sendToBackground<
        AddFaviconDockItemRequest,
        AddFaviconDockItemResponse
      >({
        name: "add-favicon-dock-item",
        body: request
      })

      if (response.success && response.item) {
        return response.item
      } else {
        throw new Error(response.error || "添加项目失败")
      }
    },
    onSuccess: () => {
      // 操作成功后重新获取数据
      queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
    },
    onError: (error) => {
      console.error("[useFaviconDockItems] 添加项目失败:", error)
    }
  })

  // 删除项目 mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await sendToBackground<
        RemoveFaviconDockItemRequest,
        RemoveFaviconDockItemResponse
      >({
        name: "remove-favicon-dock-item",
        body: { id }
      })

      if (!response.success) {
        throw new Error(response.error || "删除项目失败")
      }
    },
    onSuccess: () => {
      // 操作成功后重新获取数据
      queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
    },
    onError: (error) => {
      console.error("[useFaviconDockItems] 删除项目失败:", error)
    }
  })

  // 更新项目 mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<FaviconDockItem>
    }): Promise<void> => {
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

      if (!response.success) {
        throw new Error(response.error || "更新项目失败")
      }
    },
    onSuccess: () => {
      // 操作成功后重新获取数据
      queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
    },
    onError: (error) => {
      console.error("[useFaviconDockItems] 更新项目失败:", error)
    }
  })

  // 重新排序 mutation
  const reorderItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]): Promise<void> => {
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

      if (!response.success) {
        throw new Error(response.error || "重新排序失败")
      }
    },
    onSuccess: () => {
      // 操作成功后重新获取数据
      queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
    },
    onError: (error) => {
      console.error("[useFaviconDockItems] 重新排序失败:", error)
    }
  })

  // 更新最后使用时间 mutation
  const updateLastUsedMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
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

      if (!response.success) {
        throw new Error(response.error || "更新使用时间失败")
      }
    },
    onSuccess: () => {
      // 操作成功后重新获取数据
      queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
    },
    onError: (error) => {
      console.warn("[useFaviconDockItems] 更新使用时间失败:", error)
    }
  })

  // 封装操作函数
  const addItem = useCallback(
    async (
      request: Omit<AddFaviconDockItemRequest, "tabId"> & { tabId?: number }
    ): Promise<boolean> => {
      try {
        await addItemMutation.mutateAsync(request)
        return true
      } catch {
        return false
      }
    },
    [addItemMutation]
  )

  const removeItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeItemMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [removeItemMutation]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<FaviconDockItem>): Promise<boolean> => {
      try {
        await updateItemMutation.mutateAsync({ id, updates })
        return true
      } catch {
        return false
      }
    },
    [updateItemMutation]
  )

  const reorderItems = useCallback(
    async (itemIds: string[]): Promise<boolean> => {
      try {
        await reorderItemsMutation.mutateAsync(itemIds)
        return true
      } catch {
        return false
      }
    },
    [reorderItemsMutation]
  )

  const updateLastUsed = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await updateLastUsedMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [updateLastUsedMutation]
  )

  // 刷新项目列表
  const refreshItems = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY
    })
  }, [queryClient])

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

  // 计算加载状态
  const loading =
    addItemMutation.isPending ||
    removeItemMutation.isPending ||
    updateItemMutation.isPending ||
    reorderItemsMutation.isPending ||
    updateLastUsedMutation.isPending

  // 合并错误状态
  const error =
    addItemMutation.error?.message ||
    removeItemMutation.error?.message ||
    updateItemMutation.error?.message ||
    reorderItemsMutation.error?.message ||
    updateLastUsedMutation.error?.message ||
    null

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
