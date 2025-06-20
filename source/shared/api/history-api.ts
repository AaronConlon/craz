import { BaseApiClient } from "./base-client"
import type {
  ApiResponse,
  ApiResponseWithPagination,
  HistoryBatchAddItem,
  HistoryBatchAddResponse,
  HistoryBatchDeleteParams,
  HistoryClearParams,
  HistoryItem,
  HistoryQueryParams,
  HistorySearchParams,
  HistorySearchResponse,
  HistorySearchResult,
  HistoryStats,
  HistoryStatsParams
} from "./types"

export class HistoryApi extends BaseApiClient {
  // 基础操作

  /**
   * 获取历史记录列表
   */
  async getHistory(
    params?: HistoryQueryParams
  ): Promise<ApiResponseWithPagination<HistoryItem[]>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }

    return await this.get<ApiResponseWithPagination<HistoryItem[]>>(
      `api/history?${searchParams.toString()}`
    )
  }

  /**
   * 获取单个历史记录
   */
  async getHistoryById(id: string): Promise<ApiResponse<HistoryItem>> {
    return await this.get<ApiResponse<HistoryItem>>(`api/history/${id}`)
  }

  /**
   * 添加历史记录
   */
  async addHistory(
    data: Partial<HistoryItem>
  ): Promise<ApiResponse<{ id: string }>> {
    return await this.post<ApiResponse<{ id: string }>>("api/history", data)
  }

  /**
   * 更新历史记录
   */
  async updateHistory(
    id: string,
    data: Partial<HistoryItem>
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.put<ApiResponse<{ affected: number }>>(
      `api/history/${id}`,
      data
    )
  }

  /**
   * 删除历史记录
   */
  async deleteHistory(id: string): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      `api/history/${id}`
    )
  }

  // 批量操作

  /**
   * 批量添加历史记录
   */
  async batchAddHistory(
    items: HistoryBatchAddItem[]
  ): Promise<ApiResponse<HistoryBatchAddResponse>> {
    return await this.post<ApiResponse<HistoryBatchAddResponse>>(
      "api/history/batch",
      { items }
    )
  }

  /**
   * 批量删除历史记录
   */
  async batchDeleteHistory(
    params: HistoryBatchDeleteParams
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      "api/history/batch",
      params
    )
  }

  // 搜索功能

  /**
   * 搜索历史记录
   */
  async searchHistory(
    params: HistorySearchParams
  ): Promise<ApiResponse<HistorySearchResponse>> {
    return await this.post<ApiResponse<HistorySearchResponse>>(
      "api/history/search",
      params
    )
  }

  // 统计功能

  /**
   * 获取历史记录统计
   */
  async getHistoryStats(
    params?: HistoryStatsParams
  ): Promise<ApiResponse<HistoryStats>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }

    return await this.get<ApiResponse<HistoryStats>>(
      `api/history/stats?${searchParams.toString()}`
    )
  }

  /**
   * 清空历史记录
   */
  async clearHistory(
    params: HistoryClearParams
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      "api/history/clear",
      params
    )
  }

  // 实用方法

  /**
   * 获取最近访问的历史记录
   */
  async getRecentHistory(limit = 50): Promise<HistoryItem[]> {
    const response = await this.getHistory({
      maxResults: limit,
      order: "desc"
    })
    return response.data || []
  }

  /**
   * 获取今天的历史记录
   */
  async getTodayHistory(): Promise<HistoryItem[]> {
    const today = new Date()
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

    const response = await this.getHistory({
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
      maxResults: 1000
    })

    return response.data || []
  }

  /**
   * 获取指定天数内的历史记录
   */
  async getHistoryInDays(days: number): Promise<HistoryItem[]> {
    const endTime = Date.now()
    const startTime = endTime - days * 24 * 60 * 60 * 1000

    const response = await this.getHistory({
      startTime,
      endTime,
      maxResults: 1000
    })

    return response.data || []
  }

  /**
   * 按域名搜索历史记录
   */
  async searchByDomain(
    domain: string,
    limit = 50
  ): Promise<HistorySearchResult[]> {
    const response = await this.searchHistory({
      query: domain,
      maxResults: limit,
      searchFields: ["url"]
    })

    return response.data?.results || []
  }

  /**
   * 获取访问最多的网站
   */
  async getMostVisitedSites(limit = 10): Promise<HistoryItem[]> {
    const response = await this.getHistory({
      maxResults: 1000,
      order: "desc"
    })

    const items = response.data || []

    // 按访问次数排序
    return items.sort((a, b) => b.visitCount - a.visitCount).slice(0, limit)
  }

  /**
   * 导出历史记录
   */
  async exportHistory(): Promise<HistoryItem[]> {
    const allData: HistoryItem[] = []
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const response = await this.getHistory({
        maxResults: limit,
        offset,
        order: "desc"
      })

      const items = response.data || []
      allData.push(...items)

      hasMore = response.pagination?.hasMore || false
      offset += limit

      // 添加延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return allData
  }

  /**
   * 从 Chrome 扩展导入历史记录
   */
  async importFromChrome(
    chromeHistoryItems: chrome.history.HistoryItem[]
  ): Promise<HistoryBatchAddResponse> {
    const batchSize = 100
    let totalCreated = 0
    let totalUpdated = 0
    let totalProcessed = 0

    for (let i = 0; i < chromeHistoryItems.length; i += batchSize) {
      const batch = chromeHistoryItems.slice(i, i + batchSize)

      const items: HistoryBatchAddItem[] = batch.map((item) => ({
        url: item.url || "",
        title: item.title || "Untitled",
        lastVisitTime: item.lastVisitTime || Date.now(),
        visitCount: item.visitCount || 1,
        typedCount: item.typedCount || 0
      }))

      try {
        const response = await this.batchAddHistory(items)
        if (response.data) {
          totalCreated += response.data.created
          totalUpdated += response.data.updated
          totalProcessed += response.data.total
        }
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 导入失败:`, error)
      }

      // 添加延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    return {
      created: totalCreated,
      updated: totalUpdated,
      total: totalProcessed
    }
  }
}
