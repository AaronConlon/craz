import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  localHistory,
  type VisitRecord
} from "~/source/shared/utils/local-history"

export interface GetDefaultHistoryTop7Request {
  excludeCurrentTab?: boolean // 是否排除当前活动标签页
}

export interface GetDefaultHistoryTop7Response {
  success: boolean
  data: VisitRecord[]
  total: number
  error?: string
}

/**
 * Background Message Handler: get-default-history-top7
 *
 * 功能：获取本地历史访问次数前7的数据
 * - 从 IndexedDB 本地历史记录获取访问次数最多的前7条
 * - 排除当前活动标签页
 * - 过滤掉无效的 URL（chrome:// 等）
 *
 * 架构说明：
 * - 基于 IndexedDB 的本地历史记录
 * - 提供访问次数统计排序
 * - 智能过滤系统页面和当前标签页
 */
const handler: PlasmoMessaging.MessageHandler<
  GetDefaultHistoryTop7Request,
  GetDefaultHistoryTop7Response
> = async (req, res) => {
  console.log(
    "[Background] get-default-history-top7: 收到请求，参数:",
    req.body
  )

  try {
    // 1. 获取当前活动标签页（用于排除）
    let currentTabUrl: string | undefined
    if (req.body?.excludeCurrentTab !== false) {
      // 默认排除当前标签页
      try {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })
        currentTabUrl = currentTab?.url
        console.log(`[Background] 当前活动标签页: ${currentTabUrl}`)
      } catch (error) {
        console.warn("[Background] 获取当前标签页失败:", error)
      }
    }

    // 2. 获取最常访问的记录（前20条，用于筛选）
    const mostVisited = await localHistory.getMostVisited(20)
    console.log(`[Background] 获取到 ${mostVisited.length} 条最常访问记录`)

    // 3. 过滤并获取前7条
    const filteredRecords = mostVisited
      .filter((record) => {
        // 排除当前标签页
        if (currentTabUrl && record.url === currentTabUrl) {
          console.log(`[Background] 排除当前标签页: ${record.url}`)
          return false
        }

        // 排除无效URL
        if (
          !record.url ||
          record.url.startsWith("chrome://") ||
          record.url.startsWith("chrome-extension://") ||
          record.url.startsWith("edge://") ||
          record.url.startsWith("about:")
        ) {
          return false
        }

        return true
      })
      .slice(0, 7) // 取前7条

    console.log(`[Background] 筛选出 ${filteredRecords.length} 条历史记录`)

    // 4. 返回结果
    const response: GetDefaultHistoryTop7Response = {
      success: true,
      data: filteredRecords,
      total: filteredRecords.length
    }

    console.log(`[Background] 返回 ${response.total} 条访问次数最多的历史记录`)
    res.send(response)
  } catch (error) {
    console.error("[Background] 获取历史记录Top7失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : "获取历史记录失败"
    })
  }
}

export default handler
