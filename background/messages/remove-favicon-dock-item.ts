import type { PlasmoMessaging } from "@plasmohq/messaging"

import { faviconDockItems } from "~source/shared/utils/favicon-dock-items"

export interface RemoveFaviconDockItemRequest {
  id: string // 要删除的项目 ID
}

export interface RemoveFaviconDockItemResponse {
  success: boolean
  error?: string
}

/**
 * Background Message Handler: remove-favicon-dock-item
 *
 * 功能：删除指定的 favicon dock 项目
 * 架构说明：
 * - UI 通过此接口删除不需要的 dock 项目
 * - 根据项目 ID 进行删除
 * - 自动处理数据库清理
 */
const handler: PlasmoMessaging.MessageHandler<
  RemoveFaviconDockItemRequest,
  RemoveFaviconDockItemResponse
> = async (req, res) => {
  console.log("[Background] 删除 favicon dock 项目请求:", req.body)

  try {
    const { id } = req.body

    if (!id) {
      throw new Error("缺少必要参数: id")
    }

    // 删除项目
    const success = await faviconDockItems.removeItem(id)

    if (success) {
      console.log("[Background] Favicon dock 项目删除成功:", id)
      res.send({
        success: true
      })
    } else {
      throw new Error("删除失败，项目可能不存在")
    }
  } catch (error) {
    console.error("[Background] 删除 favicon dock 项目失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "删除失败"
    })
  }
}

export default handler
