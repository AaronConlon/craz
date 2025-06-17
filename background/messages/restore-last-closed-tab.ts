import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface RestoreLastClosedTabRequest {
  // 可选参数，暂时为空
}

export interface RestoreLastClosedTabResponse {
  success: boolean
  restoredTab?: {
    id: number
    title: string
    url: string
    isIncognito: boolean
  }
  error?: string
}

/**
 * Background Message Handler: restore-last-closed-tab
 *
 * 功能：恢复上一个被关闭的标签页
 * 特性：
 * 1. 使用 chrome.sessions API 获取最近关闭的标签页
 * 2. 自动检测原标签页是否在隐私模式
 * 3. 在相同模式下恢复标签页（隐私模式 → 隐私模式，普通模式 → 普通模式）
 * 4. 如果没有可恢复的标签页，返回友好提示
 *
 * 架构说明：
 * - 作为中间接口层，处理会话恢复的 Chrome API 调用
 * - UI 通过 messaging 发送恢复请求，background 执行实际操作
 * - 集中化权限管理和错误处理
 * - 智能处理隐私模式匹配
 */
const handler: PlasmoMessaging.MessageHandler<
  RestoreLastClosedTabRequest,
  RestoreLastClosedTabResponse
> = async (req, res) => {
  console.log(
    "Background restore-last-closed-tab: 收到恢复上一个关闭标签页请求"
  )

  try {
    // 检查是否有sessions权限
    if (!chrome.sessions) {
      console.error("Background restore-last-closed-tab: 缺少sessions权限")
      res.send({
        success: false,
        error: "缺少会话恢复权限，请检查扩展权限配置"
      })
      return
    }

    // 获取最近关闭的会话
    const recentlyClosed = await chrome.sessions.getRecentlyClosed({
      maxResults: 10 // 获取最近10个关闭的会话
    })

    console.log(
      `Background restore-last-closed-tab: 获取到 ${recentlyClosed.length} 个最近关闭的会话`
    )

    // 寻找最近关闭的标签页（不是窗口）
    const lastClosedTab = recentlyClosed.find((session) => session.tab)

    if (!lastClosedTab || !lastClosedTab.tab) {
      console.log("Background restore-last-closed-tab: 没有找到可恢复的标签页")
      res.send({
        success: false,
        error: "没有可恢复的标签页"
      })
      return
    }

    const tabToRestore = lastClosedTab.tab
    console.log(
      `Background restore-last-closed-tab: 找到可恢复的标签页 - ${tabToRestore.title} (${tabToRestore.url})`
    )

    // 获取当前窗口信息，检查是否在隐私模式
    const currentWindow = await chrome.windows.getCurrent()
    const isCurrentWindowIncognito = currentWindow.incognito || false

    // 检查要恢复的标签页是否来自隐私模式
    const wasTabIncognito = tabToRestore.incognito || false

    console.log(
      `Background restore-last-closed-tab: 当前窗口隐私模式: ${isCurrentWindowIncognito}, 原标签页隐私模式: ${wasTabIncognito}`
    )

    let targetWindowId: number | undefined

    // 如果模式不匹配，需要找到或创建合适的窗口
    if (isCurrentWindowIncognito !== wasTabIncognito) {
      // 尝试找到合适模式的现有窗口
      const allWindows = await chrome.windows.getAll()
      const suitableWindow = allWindows.find(
        (window) =>
          window.incognito === wasTabIncognito && window.type === "normal"
      )

      if (suitableWindow) {
        targetWindowId = suitableWindow.id
        console.log(
          `Background restore-last-closed-tab: 找到合适的现有窗口 ${targetWindowId}`
        )
      } else {
        // 创建新的窗口（匹配原始模式）
        const newWindow = await chrome.windows.create({
          incognito: wasTabIncognito,
          focused: true
        })
        targetWindowId = newWindow.id
        console.log(
          `Background restore-last-closed-tab: 创建新的${wasTabIncognito ? "隐私" : "普通"}窗口 ${targetWindowId}`
        )
      }
    }

    // 恢复会话
    // Chrome sessions API 的 sessionId 在 Session 对象的顶层
    const sessionId =
      (lastClosedTab as any).sessionId || lastClosedTab.tab.sessionId
    const restoredSession = await chrome.sessions.restore(sessionId)

    let restoredTab: chrome.tabs.Tab | undefined

    if (restoredSession?.tab) {
      restoredTab = restoredSession.tab
    } else if (restoredSession?.window?.tabs?.[0]) {
      restoredTab = restoredSession.window.tabs[0]
    }

    if (!restoredTab) {
      throw new Error("恢复标签页失败，无法获取恢复后的标签页信息")
    }

    // 如果需要移动到特定窗口
    if (targetWindowId && restoredTab.windowId !== targetWindowId) {
      await chrome.tabs.move(restoredTab.id!, {
        windowId: targetWindowId,
        index: -1 // 移动到窗口末尾
      })

      // 激活移动后的标签页
      await chrome.tabs.update(restoredTab.id!, { active: true })

      // 聚焦到目标窗口
      await chrome.windows.update(targetWindowId, { focused: true })
    }

    console.log(
      `Background restore-last-closed-tab: 成功恢复标签页 ${restoredTab.id} - ${restoredTab.title}`
    )

    // 返回成功结果
    res.send({
      success: true,
      restoredTab: {
        id: restoredTab.id!,
        title: restoredTab.title || "",
        url: restoredTab.url || "",
        isIncognito: wasTabIncognito
      }
    })
  } catch (error) {
    console.error("Background restore-last-closed-tab: 恢复标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "恢复标签页失败"
    })
  }
}

export default handler
