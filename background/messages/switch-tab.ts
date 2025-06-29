import type { PlasmoMessaging } from "@plasmohq/messaging";





export interface SwitchTabRequest {
  tabId: number
}

export interface SwitchTabResponse {
  success: boolean
  error?: string
}

/**
 * Background Message Handler: switch-tab
 *
 * 功能：切换到指定的 Chrome 标签页
 * 架构说明：
 * - 作为中间接口层，处理标签页切换的 Chrome API 调用
 * - UI 通过 messaging 发送切换请求，background 执行实际操作
 * - 集中化权限管理和错误处理
 * - 同时处理标签页激活和窗口聚焦，提供完整的切换体验
 */
const handler: PlasmoMessaging.MessageHandler<
  SwitchTabRequest,
  SwitchTabResponse
> = async (req, res) => {
  if (!req.body?.tabId) {
    console.error("Background switch-tab: 缺少 tabId 参数")
    res.send({
      success: false,
      error: "缺少 tabId 参数"
    })
    return
  }

  try {
    const tabId = req.body.tabId

    // 先获取标签页信息
    const tab = await chrome.tabs.get(tabId)

    if (!tab) {
      throw new Error(`标签页 ${tabId} 不存在`)
    }

    // 获取最后聚焦的窗口
    const lastFocusedWindow = await chrome.windows.getLastFocused()

    if (!lastFocusedWindow) {
      throw new Error("无法获取最后聚焦的窗口")
    }

    // 如果标签页在不同的窗口，先切换窗口焦点
    if (tab.windowId && tab.windowId !== lastFocusedWindow.id) {
      try {
        await chrome.windows.update(tab.windowId, { focused: true })

        // 等待一下确保窗口切换完成
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (windowError) {
        console.error(`Background switch-tab: 切换窗口失败:`, windowError)
        throw new Error(`切换到窗口 ${tab.windowId} 失败: ${windowError}`)
      }
    }

    // 然后激活指定的标签页
    try {
      // 使用多种方式确保标签页被正确激活
      await chrome.tabs.update(tabId, { active: true })

      // 同时使用 highlight 确保标签页被选中
      await chrome.tabs.highlight({
        windowId: tab.windowId,
        tabs: [tab.index]
      })
    } catch (tabError) {
      console.error(`Background switch-tab: 激活标签页失败:`, tabError)
      throw new Error(`激活标签页 ${tabId} 失败: ${tabError}`)
    }

    // 返回成功结果
    res.send({
      success: true
    })
  } catch (error) {
    console.error("Background switch-tab: 切换标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "切换标签页失败"
    })
  }
}

export default handler