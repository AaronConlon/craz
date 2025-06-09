import { closeTab, getTabs, switchToTab } from "./messages"

/**
 * Chrome API 服务类
 *
 * 重要架构说明：
 * - 此服务类不直接调用 Chrome APIs
 * - 所有 Chrome API 操作都通过 @plasmohq/messaging 发送到 background script
 * - Background script 作为中间接口层处理实际的 Chrome API 调用
 * - 这样设计确保了权限管理集中化和数据流向清晰
 */
export class ChromeApiService {
  /**
   * 获取所有打开的标签页
   * 通过 messaging 向 background 请求数据
   */
  static async getAllTabs(): Promise<chrome.tabs.Tab[]> {
    try {
      console.log("ChromeApiService: 正在通过 messaging 获取所有标签页...")

      // 通过 messaging 向 background 发送请求
      const response = await getTabs({})

      if (response.error) {
        throw new Error(response.error)
      }

      console.log("ChromeApiService: 获取到的标签页数量:", response.tabs.length)
      return response.tabs
    } catch (error) {
      console.error("ChromeApiService: Failed to get tabs:", error)

      if (error instanceof Error) {
        throw new Error(`获取标签页失败: ${error.message}`)
      } else {
        throw new Error("无法获取标签页信息，请检查权限配置")
      }
    }
  }

  /**
   * 获取当前活动标签页
   * 通过 messaging 向 background 请求数据
   */
  static async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    try {
      console.log("ChromeApiService: 正在通过 messaging 获取当前活动标签页...")

      // 通过 messaging 向 background 发送请求，指定只获取活动标签页
      const response = await getTabs({
        activeOnly: true,
        currentWindow: true
      })

      if (response.error) {
        throw new Error(response.error)
      }

      const activeTab = response.tabs[0] || null
      console.log(
        "ChromeApiService: 获取到活动标签页:",
        activeTab?.title || "无"
      )

      return activeTab
    } catch (error) {
      console.error("ChromeApiService: Failed to get active tab:", error)
      return null
    }
  }

  /**
   * 获取指定窗口的所有标签页
   * 通过 messaging 向 background 请求数据，直接在 background 中按窗口过滤
   */
  static async getTabsByWindow(windowId: number): Promise<chrome.tabs.Tab[]> {
    try {
      console.log(
        `ChromeApiService: 正在通过 messaging 获取窗口 ${windowId} 的标签页...`
      )

      // 通过 messaging 向 background 发送请求，指定窗口 ID
      const response = await getTabs({ windowId })

      if (response.error) {
        throw new Error(response.error)
      }

      console.log(
        `ChromeApiService: 窗口 ${windowId} 有 ${response.tabs.length} 个标签页`
      )

      return response.tabs
    } catch (error) {
      console.error(
        `ChromeApiService: Failed to get tabs for window ${windowId}:`,
        error
      )
      throw new Error("无法获取窗口标签页信息")
    }
  }

  /**
   * 切换到指定标签页
   * 通过 messaging 向 background 发送切换请求
   */
  static async switchToTab(tabId: number): Promise<void> {
    try {
      console.log(
        `ChromeApiService: 正在通过 messaging 切换到标签页 ${tabId}...`
      )

      // 通过 messaging 向 background 发送切换请求
      const response = await switchToTab({ tabId })

      if (!response.success) {
        throw new Error(response.error || "切换标签页失败")
      }

      console.log(`ChromeApiService: 成功切换到标签页 ${tabId}`)
    } catch (error) {
      console.error(
        `ChromeApiService: Failed to switch to tab ${tabId}:`,
        error
      )
      throw new Error("无法切换到指定标签页")
    }
  }

  /**
   * 关闭指定标签页
   * 通过 messaging 向 background 发送关闭请求
   */
  static async closeTab(tabId: number): Promise<void> {
    try {
      console.log(`ChromeApiService: 正在通过 messaging 关闭标签页 ${tabId}...`)

      // 通过 messaging 向 background 发送关闭请求
      const response = await closeTab({ tabId })

      if (!response.success) {
        throw new Error(response.error || "关闭标签页失败")
      }

      console.log(`ChromeApiService: 成功关闭标签页 ${tabId}`)
    } catch (error) {
      console.error(`ChromeApiService: Failed to close tab ${tabId}:`, error)
      throw new Error("无法关闭标签页")
    }
  }
}
