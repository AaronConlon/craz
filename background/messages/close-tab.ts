import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface CloseTabRequest {
  tabId: number
}

export interface CloseTabResponse {
  success: boolean
  error?: string
}

/**
 * Background Message Handler: close-tab
 *
 * 功能：关闭指定的 Chrome 标签页
 * 架构说明：
 * - 作为中间接口层，处理标签页关闭的 Chrome API 调用
 * - UI 通过 messaging 发送关闭请求，background 执行实际操作
 * - 集中化权限管理和错误处理
 * - 确保安全的标签页操作
 */
const handler: PlasmoMessaging.MessageHandler<
  CloseTabRequest,
  CloseTabResponse
> = async (req, res) => {
  console.log("Background close-tab: 收到关闭请求，标签页 ID:", req.body?.tabId)

  if (!req.body?.tabId) {
    console.error("Background close-tab: 缺少 tabId 参数")
    res.send({
      success: false,
      error: "缺少 tabId 参数"
    })
    return
  }

  try {
    const tabId = req.body.tabId

    // 获取标签页信息用于日志
    let tabTitle = "未知标签页"
    try {
      const tab = await chrome.tabs.get(tabId)
      tabTitle = tab.title || `标签页 ${tabId}`
    } catch {
      // 如果无法获取标签页信息，继续执行关闭操作
    }

    // 关闭指定的标签页
    await chrome.tabs.remove(tabId)

    console.log(`Background close-tab: 成功关闭标签页 ${tabId} (${tabTitle})`)

    // 返回成功结果
    res.send({
      success: true
    })
  } catch (error) {
    console.error("Background close-tab: 关闭标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "关闭标签页失败"
    })
  }
}

export default handler
