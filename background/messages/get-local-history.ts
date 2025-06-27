import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  localHistory,
  type VisitRecord
} from "~/source/shared/utils/local-history"

export interface GetLocalHistoryRequest {
  type: "mostVisited" | "recentVisits" | "search"
  limit?: number
  query?: string
}

export interface GetLocalHistoryResponse {
  success: boolean
  data?: Array<{
    url: string
    title: string
    domain: string
    visitCount: number
    lastVisitTime: number
    firstVisitTime: number
    favicon?: string
  }>
  error?: string
}

/**
 * Background Message Handler: get-local-history
 *
 * 功能：获取本地历史记录
 * - 支持按类型获取：最常访问、最近访问、搜索匹配
 * - 搜索功能支持标题和 URL 模糊匹配
 * - 自动过滤系统页面和无效 URL
 *
 * 架构说明：
 * - 基于 IndexedDB 的本地历史记录
 * - 支持多种查询类型和搜索功能
 * - 为搜索结果补全功能提供支持
 */
const handler: PlasmoMessaging.MessageHandler<
  GetLocalHistoryRequest,
  GetLocalHistoryResponse
> = async (req, res) => {
  console.log("[Background] get-local-history: 收到请求，参数:", req.body)

  try {
    const { type, limit = 10, query } = req.body

    let records: VisitRecord[] = []

    switch (type) {
      case "mostVisited":
        records = await localHistory.getMostVisited(limit)
        break

      case "recentVisits":
        records = await localHistory.getRecentVisits(limit)
        break

      case "search":
        if (!query) {
          throw new Error("搜索类型需要提供 query 参数")
        }

        // 执行搜索：获取更多数据用于筛选
        const searchLimit = Math.max(limit * 3, 50) // 获取更多数据以便筛选
        const allRecords = await localHistory.getMostVisited(searchLimit)

        // 执行模糊搜索
        const searchQuery = query.toLowerCase()
        records = allRecords
          .filter((record) => {
            const titleMatch = record.title?.toLowerCase().includes(searchQuery)
            const urlMatch = record.url?.toLowerCase().includes(searchQuery)
            return titleMatch || urlMatch
          })
          .slice(0, limit)

        console.log(
          `[Background] 搜索 "${query}" 找到 ${records.length} 条匹配记录`
        )
        break

      default:
        throw new Error(`不支持的查询类型: ${type}`)
    }

    // 过滤无效 URL
    const filteredRecords = records.filter((record) => {
      return (
        record.url &&
        !record.url.startsWith("chrome://") &&
        !record.url.startsWith("chrome-extension://") &&
        !record.url.startsWith("edge://") &&
        !record.url.startsWith("about:")
      )
    })

    // 转换为响应格式
    const data = filteredRecords.map((record) => ({
      url: record.url,
      title: record.title || record.url,
      domain: record.domain || new URL(record.url).hostname,
      visitCount: record.visitCount,
      lastVisitTime: record.lastVisitTime,
      firstVisitTime: record.firstVisitTime,
      favicon: record.favicon
    }))

    console.log(`[Background] 返回 ${data.length} 条历史记录`)

    res.send({
      success: true,
      data
    })
  } catch (error) {
    console.error("[Background] 获取历史记录失败:", error)

    res.send({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "获取历史记录失败"
    })
  }
}

export default handler
