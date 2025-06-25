import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  faviconDockItems,
  type FaviconDockItem
} from "~source/shared/utils/favicon-dock-items"

export interface GetFaviconDockItemsRequest {
  // 空请求，获取所有项目
}

export interface GetFaviconDockItemsResponse {
  success: boolean
  items?: FaviconDockItem[]
  count?: number
  error?: string
}

/**
 * Background Message Handler: get-favicon-dock-items
 *
 * 功能：获取所有 favicon dock 项目
 * 架构说明：
 * - UI 通过此接口获取所有已保存的 dock 项目
 * - 返回按 order 排序的项目列表
 * - 包含项目数量统计
 */
const handler: PlasmoMessaging.MessageHandler<
  GetFaviconDockItemsRequest,
  GetFaviconDockItemsResponse
> = async (req, res) => {
  console.log("[Background] 获取 favicon dock 项目请求")

  try {
    // 获取所有项目
    const items = await faviconDockItems.getAllItems()
    const count = items.length

    console.log(`[Background] 获取到 ${count} 个 favicon dock 项目`)

    res.send({
      success: true,
      items,
      count
    })
  } catch (error) {
    console.error("[Background] 获取 favicon dock 项目失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "获取失败"
    })
  }
}

export default handler
