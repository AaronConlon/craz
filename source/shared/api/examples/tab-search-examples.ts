import type { TabWithStats } from "../../../../background/messages/get-default-search-tabs"
import { getDefaultSearchTabs } from "../messages-temp"

/**
 * 标签页搜索功能示例
 * 展示如何使用 get-default-search-tabs message
 */

/**
 * 获取默认搜索结果
 * 适用于用户打开搜索界面时显示的默认推荐标签页
 */
export const getDefaultTabRecommendations = async () => {
  try {
    console.log("获取默认标签页推荐...")

    const result = await getDefaultSearchTabs({
      excludeCurrentTab: true // 排除当前活动标签页
    })

    if (result.success) {
      console.log("✅ 成功获取默认搜索结果:")
      console.log(`📍 最近访问的标签页 (${result.recentTabs.length} 个):`)

      result.recentTabs.forEach((tab, index) => {
        const lastAccessed = tab.lastAccessed
          ? new Date(tab.lastAccessed).toLocaleString()
          : "未知"
        console.log(`  ${index + 1}. ${tab.title} - 最后访问: ${lastAccessed}`)
      })

      console.log(`🔥 访问频繁的标签页 (${result.frequentTabs.length} 个):`)
      result.frequentTabs.forEach((tab, index) => {
        const visitCount = tab.visitCount || 0
        console.log(`  ${index + 1}. ${tab.title} - 访问次数: ${visitCount}`)
      })

      return {
        recentTabs: result.recentTabs,
        frequentTabs: result.frequentTabs,
        total: result.total
      }
    } else {
      console.error("❌ 获取默认搜索结果失败:", result.error)
      return null
    }
  } catch (error) {
    console.error("❌ 获取默认搜索结果异常:", error)
    return null
  }
}

/**
 * 获取指定窗口的默认搜索结果
 * 适用于多窗口环境下的标签页管理
 */
export const getDefaultTabsForWindow = async (windowId: number) => {
  try {
    console.log(`获取窗口 ${windowId} 的默认标签页推荐...`)

    const result = await getDefaultSearchTabs({
      windowId,
      excludeCurrentTab: true
    })

    if (result.success) {
      console.log(`✅ 成功获取窗口 ${windowId} 的搜索结果`)
      return result
    } else {
      console.error("❌ 获取窗口标签页失败:", result.error)
      return null
    }
  } catch (error) {
    console.error("❌ 获取窗口标签页异常:", error)
    return null
  }
}

/**
 * 格式化标签页数据用于 UI 显示
 */
export const formatTabsForDisplay = (tabs: TabWithStats[]) => {
  return tabs.map((tab) => ({
    id: tab.id,
    title: tab.title || "无标题",
    url: tab.url || "",
    favicon: tab.favIconUrl || "",
    lastAccessed: tab.lastAccessed ? new Date(tab.lastAccessed) : null,
    visitCount: tab.visitCount || 0,
    accessScore: tab.accessScore || 0,
    // 格式化显示文本
    displayText: `${tab.title || "无标题"}`,
    secondaryText: tab.url || "",
    timeText: tab.lastAccessed
      ? formatRelativeTime(new Date(tab.lastAccessed))
      : "未知时间",
    visitText: `访问 ${tab.visitCount || 0} 次`
  }))
}

/**
 * 格式化相对时间显示
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return "刚刚"
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * 在 React 组件中使用的 Hook 示例
 * 注意：这只是示例代码，实际使用时需要根据项目结构调整
 */
export const useDefaultSearchTabs = () => {
  // 这里可以使用 React 的 useState 和 useEffect
  // 但由于这是示例文件，我们只提供函数调用示例

  const loadDefaultTabs = async () => {
    const data = await getDefaultTabRecommendations()

    if (data) {
      // 格式化数据用于 UI 显示
      const formattedRecentTabs = formatTabsForDisplay(data.recentTabs)
      const formattedFrequentTabs = formatTabsForDisplay(data.frequentTabs)

      return {
        recentTabs: formattedRecentTabs,
        frequentTabs: formattedFrequentTabs,
        total: data.total
      }
    }

    return null
  }

  return { loadDefaultTabs }
}

/**
 * 智能标签页推荐示例
 * 结合时间权重和访问频率的综合推荐算法
 */
export const getSmartTabRecommendations = async () => {
  try {
    const result = await getDefaultSearchTabs({
      excludeCurrentTab: true
    })

    if (result.success) {
      // 合并最近标签页和频繁标签页，按综合分数排序
      const allTabs = [...result.recentTabs, ...result.frequentTabs]

      // 去重（基于 tab ID）
      const uniqueTabs = allTabs.reduce((acc, current) => {
        const existing = acc.find((tab) => tab.id === current.id)
        if (!existing) {
          acc.push(current)
        }
        return acc
      }, [] as TabWithStats[])

      // 按综合访问分数排序
      const smartRecommendations = uniqueTabs
        .sort((a, b) => (b.accessScore || 0) - (a.accessScore || 0))
        .slice(0, 6) // 取前6个作为智能推荐

      console.log("🧠 智能推荐标签页:")
      smartRecommendations.forEach((tab, index) => {
        console.log(`  ${index + 1}. ${tab.title} (分数: ${tab.accessScore})`)
      })

      return smartRecommendations
    }

    return []
  } catch (error) {
    console.error("获取智能推荐失败:", error)
    return []
  }
}

/**
 * 完整的使用示例
 */
export const tabSearchExampleUsage = async () => {
  console.log("=== 标签页搜索功能示例 ===")

  // 1. 获取默认推荐
  console.log("\n1. 获取默认推荐:")
  await getDefaultTabRecommendations()

  // 2. 获取智能推荐
  console.log("\n2. 获取智能推荐:")
  await getSmartTabRecommendations()

  // 3. 获取指定窗口的标签页（如果有多个窗口）
  try {
    const windows = await chrome.windows.getAll()
    if (windows.length > 1) {
      console.log("\n3. 获取指定窗口的标签页:")
      await getDefaultTabsForWindow(windows[1].id!)
    }
  } catch (error) {
    console.log("跳过多窗口示例（可能没有权限或多个窗口）")
  }

  console.log("\n=== 示例完成 ===")
}
