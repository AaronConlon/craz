import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface GetTabsRequest {
  // 过滤参数
  activeOnly?: boolean // 只获取活动标签页
  currentWindow?: boolean // 只获取当前窗口的标签页
  windowId?: number // 获取指定窗口的标签页
}

export interface GetTabsResponse {
  success: boolean
  tabs: chrome.tabs.Tab[]
  total: number
  error?: string
}

/**
 * Background Message Handler: get-tabs
 *
 * 功能：获取 Chrome 标签页信息
 * 架构说明：
 * - 作为中间接口层，处理所有标签页相关的 Chrome API 调用
 * - UI 通过 messaging 发送请求，background 处理后返回数据
 * - 集中化权限管理和错误处理
 */
const handler: PlasmoMessaging.MessageHandler<
  GetTabsRequest,
  GetTabsResponse
> = async (req, res) => {
  console.log("Background get-tabs: 收到请求，参数:", req.body)

  try {
    const queryInfo: chrome.tabs.QueryInfo = {}

    // 根据请求参数构建查询条件
    if (req.body?.activeOnly) {
      queryInfo.active = true
      console.log("Background get-tabs: 设置查询活动标签页")
    }

    if (req.body?.currentWindow) {
      queryInfo.currentWindow = true
      console.log("Background get-tabs: 设置查询当前窗口")
    }

    if (req.body?.windowId) {
      queryInfo.windowId = req.body.windowId
      console.log(`Background get-tabs: 设置查询窗口 ${req.body.windowId}`)
    }

    // 调用 Chrome API 获取标签页
    const tabs = await chrome.tabs.query(queryInfo)

    // 按最后访问时间排序（最近访问的在前）
    const sortedTabs = tabs.sort((a, b) => {
      const aTime = (a as any).lastAccessed || 0
      const bTime = (b as any).lastAccessed || 0
      return bTime - aTime
    })

    console.log(`Background get-tabs: 成功获取 ${sortedTabs.length} 个标签页`)

    // 返回结果
    res.send({
      success: true,
      tabs: sortedTabs,
      total: sortedTabs.length
    })
  } catch (error) {
    console.error("Background get-tabs: 获取标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      tabs: [],
      total: 0,
      error: error instanceof Error ? error.message : "获取标签页失败"
    })
  }
}

export default handler
