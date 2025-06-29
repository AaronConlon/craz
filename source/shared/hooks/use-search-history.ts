import { useQuery } from "@tanstack/react-query"

import {
  getLocalHistory,
  type GetLocalHistoryRequest,
  type GetLocalHistoryResponse
} from "../api/messages"

/**
 * 搜索历史记录的 React Hook
 *
 * 功能：
 * - 根据搜索查询获取匹配的历史记录
 * - 自动缓存搜索结果
 * - 查询为空时不执行请求
 *
 * @param query 搜索关键词
 * @param limit 返回结果数量限制
 */
export function useSearchHistory(query: string, limit = 10) {
  const trimmedQuery = query?.trim()

  return useQuery({
    queryKey: ["search-history", trimmedQuery, limit],
    queryFn: async () => {
      console.log("[useSearchHistory] 搜索历史记录:", {
        query: trimmedQuery,
        limit
      })

      const request: GetLocalHistoryRequest = {
        type: "search",
        query: trimmedQuery,
        limit
      }

      const response = await getLocalHistory(request)

      if (!response.success) {
        throw new Error(response.error || "搜索历史记录失败")
      }

      console.log(
        "[useSearchHistory] 搜索结果:",
        response.data?.length,
        "条记录"
      )
      return response.data || []
    },
    enabled: Boolean(trimmedQuery && trimmedQuery.length > 0), // 只有当查询非空时才执行
    staleTime: 1000 * 60 * 5, // 5分钟内数据有效
    gcTime: 1000 * 60 * 10 // 10分钟后清理缓存
  })
}
