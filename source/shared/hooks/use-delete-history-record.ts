import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { sendToBackground } from "@plasmohq/messaging"

export interface DeleteHistoryRecordRequest {
  url: string
}

export interface DeleteHistoryRecordResponse {
  success: boolean
  deleted: boolean
  error?: string
}

/**
 * 删除历史记录的 React Hook
 *
 * 功能：
 * - 调用 background message 删除指定 URL 的历史记录
 * - 自动刷新相关的查询数据 (top7, history 等)
 * - 提供加载状态和错误处理
 * - 显示用户友好的提示信息
 *
 * @returns {object} mutation 对象，包含 mutate, isPending, error 等属性
 */
export function useDeleteHistoryRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (url: string): Promise<DeleteHistoryRecordResponse> => {
      console.log("[useDeleteHistoryRecord] 开始删除历史记录:", url)

      const response = await sendToBackground({
        name: "delete-history-record",
        body: { url } as DeleteHistoryRecordRequest
      })

      if (!response.success) {
        throw new Error(response.error || "删除历史记录失败")
      }

      return response
    },
    onSuccess: (data, url) => {
      if (data.deleted) {
        console.log(`[useDeleteHistoryRecord] 历史记录删除成功: ${url}`)

        // 刷新相关查询
        queryClient.invalidateQueries({
          queryKey: ["history", "top7"]
        })
        queryClient.invalidateQueries({
          queryKey: ["history"]
        })
        queryClient.invalidateQueries({
          queryKey: ["local-history"]
        })

        toast.success("已删除历史记录")
      } else {
        console.warn(`[useDeleteHistoryRecord] 历史记录不存在: ${url}`)
        toast.info("该历史记录不存在")
      }
    },
    onError: (error, url) => {
      console.error(`[useDeleteHistoryRecord] 删除历史记录失败: ${url}`, error)

      if (error instanceof Error) {
        if (error.message.includes("缺少参数")) {
          toast.error("参数错误")
        } else if (error.message.includes("数据库")) {
          toast.error("数据库操作失败，请稍后重试")
        } else {
          toast.error(`删除失败: ${error.message}`)
        }
      } else {
        toast.error("删除历史记录失败")
      }
    }
  })
}

/**
 * 删除历史记录的简化版本 - 直接调用 background message
 *
 * @param url 要删除的历史记录 URL
 * @param options 配置选项
 * @returns Promise<boolean> 是否删除成功
 */
export async function deleteHistoryRecord(
  url: string,
  options?: {
    showToast?: boolean
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
): Promise<boolean> {
  try {
    console.log("[deleteHistoryRecord] 删除历史记录:", url)

    const response = await sendToBackground({
      name: "delete-history-record",
      body: { url } as DeleteHistoryRecordRequest
    })

    if (response.success) {
      if (response.deleted) {
        if (options?.showToast !== false) {
          toast.success("已删除历史记录")
        }
        options?.onSuccess?.()
        return true
      } else {
        if (options?.showToast !== false) {
          toast.info("该历史记录不存在")
        }
        return false
      }
    } else {
      throw new Error(response.error || "删除失败")
    }
  } catch (error) {
    console.error("Delete history record failed:", error)

    const errorMsg = error instanceof Error ? error.message : "删除历史记录失败"
    if (options?.showToast !== false) {
      toast.error(errorMsg)
    }
    options?.onError?.(error instanceof Error ? error : new Error(errorMsg))
    return false
  }
}
