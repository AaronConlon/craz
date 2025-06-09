import type { PlasmoMessaging } from "@plasmohq/messaging"

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
  console.log(
    "Background switch-tab: 收到切换请求，标签页 ID:",
    req.body?.tabId
  )

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

    // 激活指定的标签页
    await chrome.tabs.update(tabId, { active: true })
    console.log(`Background switch-tab: 标签页 ${tabId} 已激活`)

    // 获取标签页信息以切换到对应窗口
    const tab = await chrome.tabs.get(tabId)
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true })
      console.log(`Background switch-tab: 窗口 ${tab.windowId} 已聚焦`)
    }

    console.log(
      `Background switch-tab: 成功切换到标签页 ${tabId} (${tab.title})`
    )

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
