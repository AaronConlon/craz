import type { PlasmoMessaging } from "@plasmohq/messaging"

export type TabActionType =
  | "toggle-pin"
  | "create-tab"
  | "duplicate-tab"
  | "reload-tab"
  | "mute-tab"
  | "unmute-tab"
  | "discard-tab"

export interface TabActionRequest {
  action: TabActionType
  tabId?: number
  url?: string
  options?: any
}

export interface TabActionResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Background Message Handler: tab-action
 *
 * 功能：处理各种 Chrome 标签页操作
 * 架构说明：
 * - 作为中间接口层，统一处理各种标签页操作的 Chrome API 调用
 * - UI 通过 messaging 发送操作请求，background 执行实际操作
 * - 集中化权限管理和错误处理
 * - 支持多种标签页操作类型
 */
const handler: PlasmoMessaging.MessageHandler<
  TabActionRequest,
  TabActionResponse
> = async (req, res) => {
  console.log(
    "Background tab-action: 收到操作请求:",
    req.body?.action,
    req.body?.tabId
  )

  if (!req.body?.action) {
    console.error("Background tab-action: 缺少 action 参数")
    res.send({
      success: false,
      error: "缺少 action 参数"
    })
    return
  }

  try {
    const { action, tabId, url, options } = req.body

    switch (action) {
      case "toggle-pin": {
        if (!tabId) {
          throw new Error("toggle-pin 操作需要 tabId 参数")
        }

        // 获取当前标签页状态
        const tab = await chrome.tabs.get(tabId)

        // 切换固定状态
        const updatedTab = await chrome.tabs.update(tabId, {
          pinned: !tab.pinned
        })

        console.log(
          `Background tab-action: 成功${updatedTab.pinned ? "固定" : "取消固定"}标签页 ${tabId}`
        )

        res.send({
          success: true,
          data: {
            pinned: updatedTab.pinned,
            title: updatedTab.title
          }
        })
        break
      }

      case "create-tab": {
        const createProperties: chrome.tabs.CreateProperties = {
          url: url || "chrome://newtab/",
          active: options?.active !== false, // 默认激活新标签页
          ...options
        }

        const newTab = await chrome.tabs.create(createProperties)

        console.log(`Background tab-action: 成功创建新标签页 ${newTab.id}`)

        res.send({
          success: true,
          data: {
            id: newTab.id,
            url: newTab.url,
            title: newTab.title
          }
        })
        break
      }

      case "duplicate-tab": {
        if (!tabId) {
          throw new Error("duplicate-tab 操作需要 tabId 参数")
        }

        const duplicatedTab = await chrome.tabs.duplicate(tabId)

        console.log(
          `Background tab-action: 成功复制标签页 ${tabId} -> ${duplicatedTab.id}`
        )

        res.send({
          success: true,
          data: {
            id: duplicatedTab.id,
            url: duplicatedTab.url,
            title: duplicatedTab.title
          }
        })
        break
      }

      case "reload-tab": {
        if (!tabId) {
          throw new Error("reload-tab 操作需要 tabId 参数")
        }

        await chrome.tabs.reload(tabId, options)

        console.log(`Background tab-action: 成功刷新标签页 ${tabId}`)

        res.send({
          success: true
        })
        break
      }

      case "mute-tab": {
        if (!tabId) {
          throw new Error("mute-tab 操作需要 tabId 参数")
        }

        const updatedTab = await chrome.tabs.update(tabId, { muted: true })

        console.log(`Background tab-action: 成功静音标签页 ${tabId}`)

        res.send({
          success: true,
          data: {
            muted: updatedTab.mutedInfo?.muted || false
          }
        })
        break
      }

      case "unmute-tab": {
        if (!tabId) {
          throw new Error("unmute-tab 操作需要 tabId 参数")
        }

        const updatedTab = await chrome.tabs.update(tabId, { muted: false })

        console.log(`Background tab-action: 成功取消静音标签页 ${tabId}`)

        res.send({
          success: true,
          data: {
            muted: updatedTab.mutedInfo?.muted || false
          }
        })
        break
      }

      case "discard-tab": {
        if (!tabId) {
          throw new Error("discard-tab 操作需要 tabId 参数")
        }

        await chrome.tabs.discard(tabId)

        console.log(`Background tab-action: 成功丢弃标签页 ${tabId}`)

        res.send({
          success: true
        })
        break
      }

      default:
        throw new Error(`不支持的操作类型: ${action}`)
    }
  } catch (error) {
    console.error("Background tab-action: 操作失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "标签页操作失败"
    })
  }
}

export default handler
