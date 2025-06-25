import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  faviconDockItems,
  type FaviconDockItem
} from "~source/shared/utils/favicon-dock-items"

export interface UpdateFaviconDockItemsRequest {
  action: "reorder" | "update" | "updateLastUsed"
  // 重新排序
  itemIds?: string[] // 用于重新排序的项目 ID 数组
  // 更新单个项目
  id?: string // 要更新的项目 ID
  updates?: Partial<FaviconDockItem> // 更新的字段
}

export interface UpdateFaviconDockItemsResponse {
  success: boolean
  error?: string
}

/**
 * Background Message Handler: update-favicon-dock-items
 *
 * 功能：更新 favicon dock 项目（重新排序、更新信息、记录使用）
 * 架构说明：
 * - 支持多种更新操作：重新排序、更新信息、记录最后使用时间
 * - UI 通过此接口管理 dock 项目的状态
 * - 统一的更新接口，减少 message 数量
 */
const handler: PlasmoMessaging.MessageHandler<
  UpdateFaviconDockItemsRequest,
  UpdateFaviconDockItemsResponse
> = async (req, res) => {
  console.log("[Background] 更新 favicon dock 项目请求:", req.body)

  try {
    const { action, itemIds, id, updates } = req.body

    if (!action) {
      throw new Error("缺少必要参数: action")
    }

    let success = false

    switch (action) {
      case "reorder":
        if (!itemIds || !Array.isArray(itemIds)) {
          throw new Error("重新排序需要提供 itemIds 数组")
        }
        success = await faviconDockItems.reorderItems(itemIds)
        console.log(
          "[Background] Favicon dock 项目重新排序:",
          success ? "成功" : "失败"
        )
        break

      case "update":
        if (!id || !updates) {
          throw new Error("更新项目需要提供 id 和 updates")
        }
        success = await faviconDockItems.updateItem(id, updates)
        console.log(
          "[Background] Favicon dock 项目更新:",
          success ? "成功" : "失败",
          id
        )
        break

      case "updateLastUsed":
        if (!id) {
          throw new Error("更新最后使用时间需要提供 id")
        }
        success = await faviconDockItems.updateLastUsed(id)
        console.log(
          "[Background] Favicon dock 项目使用时间更新:",
          success ? "成功" : "失败",
          id
        )
        break

      default:
        throw new Error(`不支持的操作: ${action}`)
    }

    if (success) {
      res.send({
        success: true
      })
    } else {
      throw new Error(`操作失败: ${action}`)
    }
  } catch (error) {
    console.error("[Background] 更新 favicon dock 项目失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "更新失败"
    })
  }
}

export default handler
