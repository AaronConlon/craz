import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  localHistory,
  type VisitRecord
} from "~/source/shared/utils/local-history"

export interface GetDefaultSearchTabsRequest {
  // 可选的过滤参数
  excludeCurrentTab?: boolean // 是否排除当前活动标签页
  windowId?: number // 限制在指定窗口内搜索
}

export interface TabWithStats extends chrome.tabs.Tab {
  lastAccessed?: number
  visitCount?: number
  accessScore?: number // 综合访问分数
  isFromHistory?: boolean // 标记是否来自历史记录
}

/**
 * 将 VisitRecord 转换为 TabWithStats
 */
function visitRecordToTab(record: VisitRecord): TabWithStats {
  return {
    id: -1, // 历史记录没有真实的tab ID
    index: -1,
    windowId: -1,
    highlighted: false,
    active: false,
    pinned: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url: record.url,
    title: record.title,
    favIconUrl: record.favicon,
    lastAccessed: record.lastVisitTime,
    visitCount: record.visitCount,
    accessScore: record.visitCount,
    isFromHistory: true
  }
}

/**
 * Background Message Handler: get-default-search-tabs
 *
 * 功能：获取默认搜索结果的标签页
 * - 从本地历史记录获取最近访问的前2条
 * - 从本地历史记录获取访问次数最多的前5条（排除前2条）
 *
 * 架构说明：
 * - 基于 IndexedDB 的本地历史记录
 * - 智能去重，确保最近访问和最频繁访问不重复
 * - 提供完整的访问统计信息
 */
const handler: PlasmoMessaging.MessageHandler<
  GetDefaultSearchTabsRequest,
  VisitRecord[]
> = async (req, res) => {
  console.log("[Background] get-default-search-tabs: 收到请求，参数:", req.body)

  try {
    // 1. 获取最近访问的记录（前10条，用于筛选）
    const recentVisits = await localHistory.getRecentVisits(10)
    console.log(`[Background] 获取到 ${recentVisits.length} 条最近访问记录`)

    // 2. 获取最常访问的记录（前20条，用于筛选）
    const mostVisited = await localHistory.getMostVisited(20)
    console.log(`[Background] 获取到 ${mostVisited.length} 条最常访问记录`)

    // 3. 获取当前活动标签页（用于排除）
    let currentTabUrl: string | undefined
    if (req.body?.excludeCurrentTab) {
      try {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })
        currentTabUrl = currentTab?.url
      } catch (error) {
        console.warn("[Background] 获取当前标签页失败:", error)
      }
    }

    // 4. 处理最近访问的前2条（排除当前标签页）
    const recentTabs: TabWithStats[] = recentVisits
      .filter((record) => {
        // 排除当前标签页
        if (currentTabUrl && record.url === currentTabUrl) {
          return false
        }
        // 排除无效URL
        return (
          record.url &&
          !record.url.startsWith("chrome://") &&
          !record.url.startsWith("chrome-extension://")
        )
      })
      .slice(0, 2)
      .map(visitRecordToTab)

    console.log(`[Background] 筛选出 ${recentTabs.length} 个最近访问标签页`)

    // 5. 处理访问次数最多的前5条（排除最近访问的2条和当前标签页）
    const recentUrls = new Set(recentTabs.map((tab) => tab.url))
    const frequentTabs: TabWithStats[] = mostVisited
      .filter((record) => {
        // 排除当前标签页
        if (currentTabUrl && record.url === currentTabUrl) {
          return false
        }
        // 排除已在最近访问中的URL
        if (recentUrls.has(record.url)) {
          return false
        }
        // 排除无效URL
        return (
          record.url &&
          !record.url.startsWith("chrome://") &&
          !record.url.startsWith("chrome-extension://")
        )
      })
      .slice(0, 5)
      .map(visitRecordToTab)

    console.log(`[Background] 筛选出 ${frequentTabs.length} 个最常访问标签页`)

    // 6. 返回结果
    const response: GetDefaultSearchTabsResponse = {
      success: true,
      recentTabs,
      frequentTabs,
      total: recentTabs.length + frequentTabs.length
    }

    console.log(`[Background] 返回 ${response.total} 个推荐标签页`)
    res.send(response)
  } catch (error) {
    console.error("[Background] 获取默认搜索标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      recentTabs: [],
      frequentTabs: [],
      total: 0,
      error: error instanceof Error ? error.message : "获取默认搜索标签页失败"
    })
  }
}

export default handler
