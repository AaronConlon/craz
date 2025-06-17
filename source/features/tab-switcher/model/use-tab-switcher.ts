import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";



import { sendToBackground } from "@plasmohq/messaging";



import { BookmarksApiService } from "../../../shared/api/bookmarks";
import { ChromeApiService } from "../../../shared/api/chrome";
import type { Bookmark, CreateBookmarkRequest, Tab, UpdateBookmarkRequest } from "../types";


// Query Keys
export const TAB_QUERY_KEYS = {
  all: ["tabs"] as const,
  lists: () => [...TAB_QUERY_KEYS.all, "list"] as const,
  list: (filters: any) => [...TAB_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...TAB_QUERY_KEYS.all, "detail"] as const,
  detail: (id: number) => [...TAB_QUERY_KEYS.details(), id] as const
}

export const BOOKMARK_QUERY_KEYS = {
  all: ["bookmarks"] as const,
  lists: () => [...BOOKMARK_QUERY_KEYS.all, "list"] as const,
  list: (filters: any) =>
    [...BOOKMARK_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...BOOKMARK_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...BOOKMARK_QUERY_KEYS.details(), id] as const,
  tags: () => [...BOOKMARK_QUERY_KEYS.all, "tags"] as const
}

/**
 * 标签页相关 hooks
 */

// 获取所有标签页
export function useAllTabs() {
  return useQuery({
    queryKey: ["tabs", "all"],
    queryFn: async () => {
      console.log("[TabSwitcher] 开始获取所有标签页...")

      const response = await sendToBackground({
        name: "get-tabs",
        body: {}
      })

      if (!response.success) {
        throw new Error(response.error || "获取标签页失败")
      }

      console.log(`[TabSwitcher] 获取到 ${response.tabs.length} 个标签页`)

      return response.tabs
    },
    staleTime: 1000, // 1秒内不重新获取
    refetchInterval: 5000, // 每5秒自动刷新
    refetchOnWindowFocus: true
  })
}

// 获取当前活动标签页
export function useActiveTab() {
  return useQuery({
    queryKey: [...TAB_QUERY_KEYS.all, "active"],
    queryFn: ChromeApiService.getActiveTab,
    staleTime: 1000 * 10 // 10秒
  })
}

// 切换标签页
export function useSwitchTab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tabId: number) => {
      console.log("[TabSwitcher] 切换到标签页:", tabId)

      const response = await sendToBackground({
        name: "switch-tab",
        body: { tabId }
      })

      if (!response.success) {
        throw new Error(response.error || "切换标签页失败")
      }

      return response
    },
    onSuccess: () => {
      // 刷新标签页列表
      queryClient.invalidateQueries({ queryKey: ["tabs"] })
      console.log("[TabSwitcher] 标签页切换成功，刷新列表")
    },
    onError: (error) => {
      console.error("[TabSwitcher] 切换标签页失败:", error)
    }
  })
}

// 关闭标签页
export function useCloseTab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tabId: number) => {
      console.log("[TabSwitcher] 关闭标签页:", tabId)

      const response = await sendToBackground({
        name: "close-tab",
        body: { tabId }
      })

      if (!response.success) {
        throw new Error(response.error || "关闭标签页失败")
      }

      return response
    },
    onSuccess: () => {
      // 刷新标签页列表
      queryClient.invalidateQueries({ queryKey: ["tabs"] })
      console.log("[TabSwitcher] 标签页关闭成功，刷新列表")
    },
    onError: (error) => {
      console.error("[TabSwitcher] 关闭标签页失败:", error)
    }
  })
}

// 清理重复标签页
export function useCleanDuplicateTabs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options?: {
      preserveActiveTab?: boolean
      dryRun?: boolean
    }) => {
      console.log("[TabSwitcher] 开始清理重复标签页:", options)

      const response = await sendToBackground({
        name: "clean-duplicate-tabs",
        body: options || {}
      })

      if (!response.success) {
        throw new Error(response.error || "清理重复标签页失败")
      }

      console.log(
        `[TabSwitcher] 清理完成，关闭了 ${response.totalClosed} 个重复标签页`
      )

      return response
    },
    onSuccess: (data) => {
      // 刷新标签页列表
      queryClient.invalidateQueries({ queryKey: ["tabs"] })
      console.log("[TabSwitcher] 重复标签页清理成功，刷新列表")
    },
    onError: (error) => {
      console.error("[TabSwitcher] 清理重复标签页失败:", error)
    }
  })
}

/**
 * 书签相关 hooks
 */

// 获取书签列表
export function useBookmarks(params?: {
  page?: number
  pageSize?: number
  search?: string
  tags?: string[]
}) {
  return useQuery({
    queryKey: BOOKMARK_QUERY_KEYS.list(params),
    queryFn: () => BookmarksApiService.getBookmarks(params),
    staleTime: 1000 * 60 * 5 // 5分钟
  })
}

// 获取单个书签
export function useBookmark(id: string) {
  return useQuery({
    queryKey: BOOKMARK_QUERY_KEYS.detail(id),
    queryFn: () => BookmarksApiService.getBookmark(id),
    enabled: !!id
  })
}

// 创建书签
export function useCreateBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookmarkRequest) =>
      BookmarksApiService.createBookmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARK_QUERY_KEYS.all })
    }
  })
}

// 更新书签
export function useUpdateBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookmarkRequest }) =>
      BookmarksApiService.updateBookmark(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARK_QUERY_KEYS.all })
    }
  })
}

// 删除书签
export function useDeleteBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => BookmarksApiService.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARK_QUERY_KEYS.all })
    }
  })
}

// 搜索书签
export function useSearchBookmarks(
  query: string,
  options?: {
    tags?: string[]
    limit?: number
  }
) {
  return useQuery({
    queryKey: [...BOOKMARK_QUERY_KEYS.all, "search", query, options],
    queryFn: () => BookmarksApiService.searchBookmarks(query, options),
    enabled: !!query.trim(),
    staleTime: 1000 * 60 * 2 // 2分钟
  })
}

// 获取所有标签
export function useBookmarkTags() {
  return useQuery({
    queryKey: BOOKMARK_QUERY_KEYS.tags(),
    queryFn: BookmarksApiService.getTags,
    staleTime: 1000 * 60 * 10 // 10分钟
  })
}

// 检查书签是否存在
export function useCheckBookmarkExists(url: string) {
  return useQuery({
    queryKey: [...BOOKMARK_QUERY_KEYS.all, "check", url],
    queryFn: () => BookmarksApiService.checkBookmarkExists(url),
    enabled: !!url,
    staleTime: 1000 * 60 * 5 // 5分钟
  })
}