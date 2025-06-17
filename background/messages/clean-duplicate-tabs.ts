import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface CleanDuplicateTabsRequest {
  // 可选的过滤参数
  preserveActiveTab?: boolean // 保留活动标签页，默认 true
  dryRun?: boolean // 预览模式，不实际关闭，默认 false
}

export interface CleanDuplicateTabsResponse {
  success: boolean
  closedTabs: Array<{
    id: number
    title: string
    url: string
    windowId: number
    wasActive: boolean
  }>
  duplicateGroups: Array<{
    url: string
    count: number
    kept: { id: number; title: string; windowId: number; wasActive: boolean }
    removed: Array<{
      id: number
      title: string
      windowId: number
      wasActive: boolean
    }>
  }>
  totalClosed: number
  error?: string
}

/**
 * Background Message Handler: clean-duplicate-tabs
 *
 * 功能：清理重复的 Chrome 标签页
 * 清理策略：
 * 1. 按 URL 分组找出重复的标签页
 * 2. 对于每组重复标签页：
 *    - 优先保留当前窗口的标签页
 *    - 在当前窗口中，优先保留活动标签页
 *    - 在当前窗口中，其次保留最近访问的标签页
 *    - 关闭其他窗口中的重复标签页
 * 3. 返回清理结果和统计信息
 *
 * 架构说明：
 * - 作为中间接口层，处理复杂的标签页批量操作
 * - UI 通过 messaging 发送清理请求，background 执行实际操作
 * - 集中化权限管理、错误处理和复杂业务逻辑
 */
const handler: PlasmoMessaging.MessageHandler<
  CleanDuplicateTabsRequest,
  CleanDuplicateTabsResponse
> = async (req, res) => {
  console.log(
    "Background clean-duplicate-tabs: 收到清理重复标签页请求",
    req.body
  )

  try {
    const preserveActiveTab = req.body?.preserveActiveTab ?? true
    const dryRun = req.body?.dryRun ?? false

    // 获取所有标签页
    const allTabs = await chrome.tabs.query({})
    console.log(
      `Background clean-duplicate-tabs: 获取到 ${allTabs.length} 个标签页`
    )

    // 获取当前窗口ID
    const currentWindow = await chrome.windows.getCurrent()
    const currentWindowId = currentWindow.id!

    // 按URL分组，找出重复的标签页
    const urlGroups = new Map<string, chrome.tabs.Tab[]>()

    for (const tab of allTabs) {
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        // 跳过系统页面和扩展页面
        continue
      }

      // 标准化URL（去除fragment和某些参数）
      const normalizedUrl = normalizeUrl(tab.url)

      if (!urlGroups.has(normalizedUrl)) {
        urlGroups.set(normalizedUrl, [])
      }
      urlGroups.get(normalizedUrl)!.push(tab)
    }

    // 找出有重复的URL组
    const duplicateGroups = Array.from(urlGroups.entries())
      .filter(([url, tabs]) => tabs.length > 1)
      .map(([url, tabs]) => ({ url, tabs }))

    console.log(
      `Background clean-duplicate-tabs: 发现 ${duplicateGroups.length} 组重复标签页`
    )

    const closedTabs: CleanDuplicateTabsResponse["closedTabs"] = []
    const resultGroups: CleanDuplicateTabsResponse["duplicateGroups"] = []

    // 处理每组重复标签页
    for (const group of duplicateGroups) {
      const { url, tabs } = group

      // 按优先级排序标签页
      const sortedTabs = [...tabs].sort((a, b) => {
        // 1. 优先保留当前窗口的标签页
        if (a.windowId === currentWindowId && b.windowId !== currentWindowId)
          return -1
        if (a.windowId !== currentWindowId && b.windowId === currentWindowId)
          return 1

        // 2. 在同一窗口中，优先保留活动标签页
        if (preserveActiveTab) {
          if (a.active && !b.active) return -1
          if (!a.active && b.active) return 1
        }

        // 3. 按最后访问时间排序（最近访问的优先保留）
        const aTime = (a as any).lastAccessed || 0
        const bTime = (b as any).lastAccessed || 0
        return bTime - aTime
      })

      // 保留第一个（优先级最高的），关闭其他的
      const toKeep = sortedTabs[0]
      const toRemove = sortedTabs.slice(1)

      console.log(
        `Background clean-duplicate-tabs: URL ${url} - 保留标签页 ${toKeep.id}，关闭 ${toRemove.length} 个重复标签页`
      )

      const removedTabInfo = []

      // 关闭重复的标签页
      for (const tab of toRemove) {
        const tabInfo = {
          id: tab.id!,
          title: tab.title || "",
          url: tab.url || "",
          windowId: tab.windowId || 0,
          wasActive: tab.active || false
        }

        if (!dryRun) {
          try {
            await chrome.tabs.remove(tab.id!)
            console.log(
              `Background clean-duplicate-tabs: 成功关闭标签页 ${tab.id} (${tab.title})`
            )
          } catch (error) {
            console.error(
              `Background clean-duplicate-tabs: 关闭标签页 ${tab.id} 失败:`,
              error
            )
            // 继续处理其他标签页，但不将此标签页加入关闭列表
            continue
          }
        }

        closedTabs.push(tabInfo)
        removedTabInfo.push(tabInfo)
      }

      // 记录这组重复标签页的处理结果
      resultGroups.push({
        url,
        count: tabs.length,
        kept: {
          id: toKeep.id!,
          title: toKeep.title || "",
          windowId: toKeep.windowId || 0,
          wasActive: toKeep.active || false
        },
        removed: removedTabInfo
      })
    }

    const totalClosed = closedTabs.length
    console.log(
      `Background clean-duplicate-tabs: ${dryRun ? "预览" : "实际"}关闭了 ${totalClosed} 个重复标签页`
    )

    // 返回结果
    res.send({
      success: true,
      closedTabs,
      duplicateGroups: resultGroups,
      totalClosed
    })
  } catch (error) {
    console.error("Background clean-duplicate-tabs: 清理重复标签页失败:", error)

    // 统一错误处理和返回
    res.send({
      success: false,
      closedTabs: [],
      duplicateGroups: [],
      totalClosed: 0,
      error: error instanceof Error ? error.message : "清理重复标签页失败"
    })
  }
}

/**
 * 标准化URL，用于重复检测
 * 去除fragment(#)和某些查询参数，提高重复检测的准确性
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)

    // 移除fragment
    urlObj.hash = ""

    // 移除某些常见的跟踪参数
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "source"
    ]

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param)
    })

    return urlObj.toString()
  } catch {
    // 如果URL解析失败，返回原始URL
    return url
  }
}

export default handler
