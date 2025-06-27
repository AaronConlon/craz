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
 * - 支持启用/禁用查询
 *
 * @param query 搜索关键词
 * @param limit 返回结果数量限制
 * @param enabled 是否启用查询
 */
export function useSearchHistory(query: string, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["search-history", query, limit],
    queryFn: async (): Promise<GetLocalHistoryResponse> => {
      console.log("[useSearchHistory] 搜索历史记录:", { query, limit })

      const request: GetLocalHistoryRequest = {
        type: "search",
        query: query.trim(),
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
      return response
    },
    enabled: enabled && !!query.trim(),
    staleTime: 1000 * 60 * 5, // 5分钟内数据有效
    gcTime: 1000 * 60 * 10 // 10分钟后清理缓存
  })
}
