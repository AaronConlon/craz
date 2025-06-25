/**
 * Background Script - 主入口文件
 *
 * 功能：
 * - 监听标签页激活和更新事件
 * - 记录访问历史到 IndexedDB
 * - 获取页面标题和 favicon
 * - 定期清理过期数据
 * - 防重复记录机制（3秒内相同URL不重复计数）
 * - 🔥 严格检查：仅当标签页为用户当前正在查看时才记录访问
 */

import { localHistory } from "~/source/shared/utils/local-history"

// console.log("[Background] Craz Extension 后台脚本启动")

/**
 * 使用 Canvas 绘制自定义图标
 * 显示当前打开的标签页数量
 */
async function drawCustomIcon(tabCount: number, size: number = 19) {
  try {
    // 创建高分辨率 canvas
    const scale = 2 // 2x 分辨率提升质量
    const canvas = new OffscreenCanvas(size * scale, size * scale)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("无法获取 canvas 上下文")
    }

    // 格式化数字显示
    const displayText = tabCount > 999 ? "999" : tabCount.toString()

    // 设置高质量渲染
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // 缩放上下文以支持高分辨率
    ctx.scale(scale, scale)

    // 清空画布
    ctx.clearRect(0, 0, size, size)

    const center = size / 2
    const borderRadius = 3
    const padding = 1 // 边框和内边距
    const rectX = padding
    const rectY = padding
    const rectWidth = size - padding * 2
    const rectHeight = size - padding * 2

    // 绘制圆角矩形背景
    ctx.fillStyle = "#3b82f6" // 主题蓝色
    ctx.beginPath()

    // 手动绘制圆角矩形以确保兼容性
    if (typeof ctx.roundRect === "function") {
      // 使用原生 roundRect 方法（Chrome 99+）
      ctx.roundRect(rectX, rectY, rectWidth, rectHeight, borderRadius)
    } else {
      // 手动绘制圆角矩形
      ctx.moveTo(rectX + borderRadius, rectY)
      ctx.lineTo(rectX + rectWidth - borderRadius, rectY)
      ctx.quadraticCurveTo(
        rectX + rectWidth,
        rectY,
        rectX + rectWidth,
        rectY + borderRadius
      )
      ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius)
      ctx.quadraticCurveTo(
        rectX + rectWidth,
        rectY + rectHeight,
        rectX + rectWidth - borderRadius,
        rectY + rectHeight
      )
      ctx.lineTo(rectX + borderRadius, rectY + rectHeight)
      ctx.quadraticCurveTo(
        rectX,
        rectY + rectHeight,
        rectX,
        rectY + rectHeight - borderRadius
      )
      ctx.lineTo(rectX, rectY + borderRadius)
      ctx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY)
      ctx.closePath()
    }

    ctx.fill()

    // 添加内阴影效果 (线性渐变适合矩形)
    const gradient = ctx.createLinearGradient(
      rectX,
      rectY,
      rectX,
      rectY + rectHeight
    )
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)")
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)")
    ctx.fillStyle = gradient
    ctx.fill()

    // 添加边框
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 0.5
    ctx.stroke()

    // 设置文字样式
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // 根据数字长度和画布大小调整字体大小（长方形有更多水平空间）
    let fontSize = size * 0.7 // 基础字体大小为画布大小的 70%
    if (displayText.length === 1) {
      fontSize = size * 0.75 // 单数字可以更大
    } else if (displayText.length === 2) {
      fontSize = size * 0.65 // 双数字适中
    } else {
      fontSize = size * 0.55 // 三数字稍小但仍清晰
    }

    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

    // 添加文字阴影效果
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 1
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    // 绘制数字
    ctx.fillText(displayText, center, center)

    // 重置阴影
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // 转换为 ImageData
    const imageData = ctx.getImageData(0, 0, size * scale, size * scale)

    return imageData
  } catch (error) {
    console.error("[Background] 绘制自定义图标失败:", error)
    return null
  }
}

/**
 * 创建多尺寸图标对象
 */
async function createMultiSizeIcons(tabCount: number) {
  const sizes = [16, 19, 32, 38, 48, 128]
  const icons: { [key: string]: ImageData } = {}

  for (const size of sizes) {
    const icon = await drawCustomIcon(tabCount, size)
    if (icon) {
      icons[size.toString()] = icon
    }
  }

  return Object.keys(icons).length > 0 ? icons : null
}

/**
 * 更新扩展图标 Badge
 * 显示当前打开的标签页数量
 */
async function updateBadge() {
  try {
    // 获取所有标签页
    const tabs = await chrome.tabs.query({})
    const tabCount = tabs.length

    console.log(`[Background] 更新 Badge: ${tabCount} 个标签页`)

    if (tabCount === 0) {
      // 没有标签页时，恢复原始图标并清除 badge
      await chrome.action.setIcon({
        path: {
          "16": "assets/icon.png",
          "32": "assets/icon.png",
          "48": "assets/icon.png",
          "128": "assets/icon.png"
        }
      })

      // 清除可能存在的 badge
      await chrome.action.setBadgeText({ text: "" })
      return
    }

    // 创建多尺寸自定义图标
    const customIcons = await createMultiSizeIcons(tabCount)

    if (customIcons) {
      // 设置自定义图标
      await chrome.action.setIcon({
        imageData: customIcons
      })

      // 清除默认 badge，因为我们用自定义图标显示数量
      await chrome.action.setBadgeText({ text: "" })
    } else {
      // 如果绘制失败，回退到默认 badge
      console.warn("[Background] 自定义图标绘制失败，回退到默认 badge")

      await chrome.action.setBadgeText({
        text: tabCount > 999 ? "999" : tabCount.toString()
      })

      await chrome.action.setBadgeBackgroundColor({
        color: "#3b82f6"
      })

      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({
          color: "#ffffff"
        })
      }
    }
  } catch (error) {
    console.error("[Background] 更新 Badge 失败:", error)
  }
}

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

  // console.log(`[Background] 跳过重复访问记录: ${url} (间隔: ${timeDiff}ms)`)
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
 * 检查标签页是否为当前用户正在查看的激活标签页
 */
async function isCurrentActiveTab(tabId: number): Promise<boolean> {
  try {
    // 获取当前窗口的激活标签页
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (!activeTab || activeTab.id !== tabId) {
      return false
    }

    // 检查窗口是否是当前焦点窗口
    const currentWindow = await chrome.windows.getCurrent()
    if (!currentWindow.focused) {
      return false
    }

    return true
  } catch (error) {
    console.error("[Background] 检查激活标签页状态失败:", error)
    return false
  }
}

/**
 * 记录标签页访问（仅当标签页为用户当前正在查看时）
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

    // 🔥 关键检查：确保标签页是用户当前正在查看的
    if (!tab.id || !(await isCurrentActiveTab(tab.id))) {
      console.log(`[Background] 跳过非激活标签页记录: ${tab.url}`)
      return
    }

    const url = tab.url

    // 检查是否应该记录（防重复机制）
    if (!shouldRecordVisit(url)) {
      return
    }

    const title = tab.title || new URL(url).hostname
    const favicon = tab.favIconUrl

    console.log(`[Background] 📊 记录当前激活标签页访问: ${title} - ${url}`)

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
  if (tab && (await isCurrentActiveTab(activeInfo.tabId))) {
    console.log(`[Background] 确认当前激活标签页: ${activeInfo.tabId}`)
    currentActiveTab = tab
    await recordTabVisit(tab)
  }

  // 更新 badge
  await updateBadge()
})

/**
 * 监听标签页更新事件（URL 变化、页面加载完成等）
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在页面加载完成时记录，且必须是当前激活的标签页
  if (
    changeInfo.status === "complete" &&
    tab.active &&
    (await isCurrentActiveTab(tabId))
  ) {
    console.log(`[Background] 当前激活标签页更新完成: ${tabId}`)
    currentActiveTab = tab
    await recordTabVisit(tab)
  }

  // 如果 URL 发生变化（如单页应用路由变化），且是当前激活的标签页
  if (changeInfo.url && tab.active && (await isCurrentActiveTab(tabId))) {
    console.log(
      `[Background] 当前激活标签页 URL 变化: ${tabId} -> ${changeInfo.url}`
    )
    await recordTabVisit(tab)
  }

  // 更新 badge
  await updateBadge()
})

/**
 * 监听标签页创建事件
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log(`[Background] 新标签页创建: ${tab.id}`)

  // 如果新标签页立即激活且有 URL，且确实是当前激活的标签页
  if (tab.active && tab.url && tab.id && (await isCurrentActiveTab(tab.id))) {
    console.log(`[Background] 记录新创建的激活标签页: ${tab.id}`)
    currentActiveTab = tab
    await recordTabVisit(tab)
  }

  // 更新 badge
  await updateBadge()
})

/**
 * 监听标签页关闭事件
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  console.log(`[Background] 标签页关闭: ${tabId}`)

  // 更新 badge
  await updateBadge()
})

/**
 * 监听窗口关闭事件
 */
chrome.windows.onRemoved.addListener(async (windowId) => {
  console.log(`[Background] 窗口关闭: ${windowId}`)

  // 更新 badge
  await updateBadge()
})

/**
 * 监听窗口焦点变化
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 窗口失去焦点
    console.log("[Background] 所有窗口失去焦点，停止记录")
    return
  }

  // 获取当前激活的标签页
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      windowId: windowId
    })

    if (activeTab && activeTab.id && (await isCurrentActiveTab(activeTab.id))) {
      console.log(`[Background] 窗口焦点变化，当前激活标签页: ${activeTab.id}`)
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
      // console.log(`[Background] 初始化当前激活标签页: ${activeTab.id}`)
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
      // console.log("[Background] 开始清理过期历史数据")
      const deletedCount = await localHistory.cleanExpiredData(DAYS_TO_KEEP)
      // console.log(`[Background] 清理完成，删除了 ${deletedCount} 条过期记录`)
    } catch (error) {
      console.error("[Background] 清理过期数据失败:", error)
    }
  }, CLEANUP_INTERVAL)

  // 立即执行一次清理
  try {
    const deletedCount = await localHistory.cleanExpiredData(DAYS_TO_KEEP)
    // console.log(`[Background] 启动时清理，删除了 ${deletedCount} 条过期记录`)
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

/**
 * 测试自定义图标绘制功能
 */
async function testCustomIconDrawing() {
  try {
    console.log("[Background] 🎨 测试自定义圆角矩形图标绘制功能...")

    // 测试不同数字的绘制
    const testCounts = [1, 12, 123, 999, 1234]

    for (const count of testCounts) {
      const icon = await drawCustomIcon(count, 19)
      if (icon) {
        console.log(
          `[Background] ✅ 成功绘制圆角矩形数字 ${count} 的图标 (${icon.width}x${icon.height})`
        )
      } else {
        console.log(`[Background] ❌ 绘制数字 ${count} 的圆角矩形图标失败`)
      }
    }

    // 测试多尺寸图标
    const multiSizeIcons = await createMultiSizeIcons(42)
    if (multiSizeIcons) {
      const sizes = Object.keys(multiSizeIcons)
      console.log(
        `[Background] ✅ 成功创建多尺寸圆角矩形图标: ${sizes.join(", ")}`
      )
    } else {
      console.log("[Background] ❌ 创建多尺寸圆角矩形图标失败")
    }

    console.log("[Background] 🎨 自定义圆角矩形图标绘制测试完成")
  } catch (error) {
    console.error("[Background] 自定义圆角矩形图标绘制测试失败:", error)
  }
}

// 启动初始化
initializeCurrentTab()
scheduleDataCleanup()

// 测试自定义图标绘制（仅在开发模式下）
if (process.env.NODE_ENV === "development") {
  testCustomIconDrawing()
}

// 初始化 badge
updateBadge()

console.log("[Background] 🚀 Craz Extension 后台脚本启动完成")
