import { useState } from "react"
import { toast } from "sonner"

import { sendToBackground } from "@plasmohq/messaging"

import type {
  RestoreLastClosedTabRequest,
  RestoreLastClosedTabResponse
} from "~/background/messages/restore-last-closed-tab"

/**
 * Hook: useRestoreLastClosedTab
 *
 * 功能：恢复上一个被关闭的标签页
 * 特性：
 * 1. 通过 messaging 与 background 通信
 * 2. 支持隐私模式自动匹配
 * 3. 提供 loading 状态和错误处理
 * 4. 集成 Toast 通知用户操作结果
 *
 * 架构说明：
 * - UI 层 hook，通过 messaging 调用 background API
 * - background 作为中间接口层处理 Chrome sessions API
 * - 集中化状态管理和用户反馈
 */
export const useRestoreLastClosedTab = () => {
  const [isRestoring, setIsRestoring] = useState(false)

  const restoreLastClosedTab = async () => {
    if (isRestoring) {
      console.log("useRestoreLastClosedTab: 已有恢复操作在进行中，跳过")
      return
    }

    setIsRestoring(true)
    console.log("useRestoreLastClosedTab: 开始恢复上一个关闭的标签页")

    try {
      // 通过 messaging 发送恢复请求到 background
      const response = await sendToBackground<
        RestoreLastClosedTabRequest,
        RestoreLastClosedTabResponse
      >({
        name: "restore-last-closed-tab",
        body: {}
      })

      console.log("useRestoreLastClosedTab: 收到响应", response)

      if (response.success && response.restoredTab) {
        const { restoredTab } = response

        // 显示成功提示
        toast.success(
          `已恢复 ${restoredTab.isIncognito ? "隐私" : ""}标签页: ${restoredTab.title || "无标题页面"}`,
          {
            duration: 2500
          }
        )

        console.log(
          `useRestoreLastClosedTab: 成功恢复标签页 ${restoredTab.id} - ${restoredTab.title}`
        )
      } else {
        // 显示错误提示
        const errorMessage = response.error || "恢复标签页失败"
        toast.error(errorMessage, {
          duration: 2500
        })

        console.warn("useRestoreLastClosedTab: 恢复失败:", errorMessage)
      }
    } catch (error) {
      console.error("useRestoreLastClosedTab: 网络或通信错误:", error)

      // 显示通用错误提示
      toast.error("恢复标签页失败，请重试", {
        duration: 2500
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return {
    restoreLastClosedTab,
    isRestoring
  }
}
