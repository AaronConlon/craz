import type { PlasmoMessaging } from "@plasmohq/messaging"

import { localHistory } from "~source/shared/utils/local-history"

export interface DeleteHistoryRecordRequest {
  url: string // 要删除的历史记录 URL
}

export interface DeleteHistoryRecordResponse {
  success: boolean
  deleted: boolean
  error?: string
}

/**
 * Background Message Handler: delete-history-record
 *
 * 功能：删除指定的历史记录
 * - 从 IndexedDB 本地历史记录中删除指定 URL 的记录
 * - 返回删除结果状态
 *
 * 架构说明：
 * - 基于 IndexedDB 的本地历史记录管理
 * - 删除后前端可以重新获取 top7 数据
 * - 提供详细的操作结果反馈
 */
const handler: PlasmoMessaging.MessageHandler<
  DeleteHistoryRecordRequest,
  DeleteHistoryRecordResponse
> = async (req, res) => {
  console.log(
    "[Background] delete-history-record: 收到删除请求，参数:",
    req.body
  )

  try {
    const { url } = req.body

    if (!url) {
      throw new Error("缺少必要参数: url")
    }

    // 删除历史记录
    console.log(`[Background] 开始删除历史记录: ${url}`)
    const deleted = await localHistory.deleteRecord(url)

    if (deleted) {
      console.log(`[Background] 历史记录删除成功: ${url}`)

      res.send({
        success: true,
        deleted: true
      })
    } else {
      console.warn(`[Background] 历史记录不存在或删除失败: ${url}`)

      res.send({
        success: true,
        deleted: false
      })
    }
  } catch (error) {
    console.error("[Background] 删除历史记录失败:", error)

    res.send({
      success: false,
      deleted: false,
      error: error instanceof Error ? error.message : "删除历史记录失败"
    })
  }
}

export default handler
