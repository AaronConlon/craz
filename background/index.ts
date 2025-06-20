/**
 * Background Script - 主入口文件
 *
 * 功能：
 * - 监听标签页激活和更新事件
 * - 记录访问历史到 IndexedDB
 * - 获取页面标题和 favicon
 * - 定期清理过期数据
 * - 防重复记录机制（3秒内相同URL不重复计数）
 */

import { localHistory } from "~/source/shared/utils/local-history"

console.log("[Background] Craz Extension 后台脚本启动")

// 存储当前激活的标签页信息
let currentActiveTab: chrome.tabs.Tab | null = null

// 防重复记录机制
interface LastVisitRecord {
  url: string
  timestamp: number
}

let lastVisitRecord: LastVisitRecord | null = null
const DUPLICATE_THRESHOLD = 3000 // 3秒内不重复记录

/**
 * 检查是否应该记录访问（防重复机制）
 */
function shouldRecordVisit(url: string): boolean {
  const now = Date.now()

  // 如果没有上次记录，直接记录
  if (!lastVisitRecord) {
    return true
  }

  // 如果 URL 不同，直接记录
  if (lastVisitRecord.url !== url) {
    return true
  }

  // 如果是相同 URL，检查时间间隔
  const timeDiff = now - lastVisitRecord.timestamp
  if (timeDiff >= DUPLICATE_THRESHOLD) {
    return true
  }

  console.log(`[Background] 跳过重复访问记录: ${url} (间隔: ${timeDiff}ms)`)
  return false
}

/**
 * 更新最后访问记录
 */
function updateLastVisitRecord(url: string) {
  lastVisitRecord = {
    url,
    timestamp: Date.now()
  }
}

/**
 * 记录标签页访问
 */
async function recordTabVisit(tab: chrome.tabs.Tab) {
  try {
    // 过滤无效的 URL
    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:") ||
      tab.url === "chrome://newtab/" ||
      tab.url === "edge://newtab/"
    ) {
      return
    }

    const url = tab.url

    // 检查是否应该记录（防重复机制）
    if (!shouldRecordVisit(url)) {
      return
    }

    const title = tab.title || new URL(url).hostname
    const favicon = tab.favIconUrl

    console.log(`[Background] 记录访问: ${title} - ${url}`)

    // 记录到本地历史
    await localHistory.recordVisit(url, title, favicon)

    // 更新最后访问记录
    updateLastVisitRecord(url)

    // 可选：同步到远程服务器
    // await syncToRemoteServer(url, title, favicon)
  } catch (error) {
    console.error("[Background] 记录访问失败:", error)
  }
}

/**
 * 获取标签页完整信息
 */
async function getTabInfo(tabId: number): Promise<chrome.tabs.Tab | null> {
  try {
    return await chrome.tabs.get(tabId)
  } catch (error) {
    console.error("[Background] 获取标签页信息失败:", error)
    return null
  }
}

/**
 * 监听标签页激活事件
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log(`[Background] 标签页激活: ${activeInfo.tabId}`)

  const tab = await getTabInfo(activeInfo.tabId)
  if (tab) {
    currentActiveTab = tab
    await recordTabVisit(tab)
  }
})

/**
 * 监听标签页更新事件（URL 变化、页面加载完成等）
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在页面加载完成时记录
  if (changeInfo.status === "complete" && tab.active) {
    console.log(`[Background] 标签页更新完成: ${tabId}`)

    currentActiveTab = tab
    await recordTabVisit(tab)
  }

  // 如果 URL 发生变化（如单页应用路由变化）
  if (changeInfo.url && tab.active) {
    console.log(`[Background] 标签页 URL 变化: ${tabId} -> ${changeInfo.url}`)
    await recordTabVisit(tab)
  }
})

/**
 * 监听标签页创建事件
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log(`[Background] 新标签页创建: ${tab.id}`)

  // 如果新标签页立即激活且有 URL
  if (tab.active && tab.url) {
    currentActiveTab = tab
    await recordTabVisit(tab)
  }
})

/**
 * 监听窗口焦点变化
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 窗口失去焦点
    console.log("[Background] 所有窗口失去焦点")
    return
  }

  // 获取当前激活的标签页
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      windowId: windowId
    })

    if (activeTab) {
      console.log(`[Background] 窗口焦点变化，激活标签页: ${activeTab.id}`)
      currentActiveTab = activeTab
      await recordTabVisit(activeTab)
    }
  } catch (error) {
    console.error("[Background] 处理窗口焦点变化失败:", error)
  }
})

/**
 * 扩展启动时记录当前激活的标签页
 */
async function initializeCurrentTab() {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    if (activeTab) {
      console.log(`[Background] 初始化当前激活标签页: ${activeTab.id}`)
      currentActiveTab = activeTab
      await recordTabVisit(activeTab)
    }
  } catch (error) {
    console.error("[Background] 初始化当前标签页失败:", error)
  }
}

/**
 * 定期清理过期数据
 */
async function scheduleDataCleanup() {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24小时
  const DAYS_TO_KEEP = 90 // 保留90天

  setInterval(async () => {
    try {
      console.log("[Background] 开始清理过期历史数据")
      const deletedCount = await localHistory.cleanExpiredData(DAYS_TO_KEEP)
      console.log(`[Background] 清理完成，删除了 ${deletedCount} 条过期记录`)
    } catch (error) {
      console.error("[Background] 清理过期数据失败:", error)
    }
  }, CLEANUP_INTERVAL)

  // 立即执行一次清理
  try {
    const deletedCount = await localHistory.cleanExpiredData(DAYS_TO_KEEP)
    console.log(`[Background] 启动时清理，删除了 ${deletedCount} 条过期记录`)
  } catch (error) {
    console.error("[Background] 启动时清理失败:", error)
  }
}

/**
 * 处理来自 popup/content script 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentTab") {
    sendResponse(currentActiveTab)
    return true
  }

  if (request.action === "recordVisit" && request.data) {
    recordTabVisit(request.data)
      .then(() => {
        sendResponse({ success: true })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true // 异步响应
  }
})

// 启动初始化
initializeCurrentTab()
scheduleDataCleanup()

console.log("[Background] 标签页访问监听器已启动")
