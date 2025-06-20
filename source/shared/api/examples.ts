import { getEnvironmentInfo } from "../config/env"
// 导入标签页搜索功能示例
import {
  getDefaultTabRecommendations,
  getSmartTabRecommendations,
  tabSearchExampleUsage
} from "./examples/tab-search-examples"
import { createCrazApi, createCrazApiFromEnv } from "./index"
import type { CreateBookmarkDto, HistoryBatchAddItem } from "./types"

// 方式1: 使用环境变量创建 API 实例 (推荐)
const api = createCrazApiFromEnv("your-jwt-token")

// 方式2: 手动指定配置
const apiManual = createCrazApi({
  baseUrl: "https://api.craz.com",
  token: "your-jwt-token"
})

// 方式3: 使用默认环境变量，只传入 token
const apiDefault = createCrazApi({
  token: "your-jwt-token"
  // 其他配置会自动从环境变量读取
})

// 获取环境信息
console.log("Environment Info:", getEnvironmentInfo())

// 认证示例
export const authExamples = {
  // 用户登录
  async login() {
    try {
      const result = await api.auth.login({
        email: "user@example.com",
        password: "password123"
      })

      if (result.success) {
        console.log("登录成功:", result.user)
        // 令牌会自动设置到所有 API 模块
      } else {
        console.error("登录失败:", result.error)
      }
    } catch (error) {
      console.error("登录异常:", error)
    }
  },

  // 检查认证状态
  async checkAuth() {
    const { authenticated, user } = await api.auth.checkAuthStatus()

    if (authenticated) {
      console.log("用户已认证:", user)
    } else {
      console.log("用户未认证，需要登录")
    }
  }
}

// 书签示例
export const bookmarkExamples = {
  // 获取并显示书签
  async displayBookmarks() {
    const bookmarks = await api.bookmarks.getBookmarks()

    console.log(`共有 ${bookmarks.length} 个书签:`)
    bookmarks.forEach((bookmark) => {
      console.log(`- ${bookmark.title}: ${bookmark.url}`)
    })
  },

  // 从当前标签页创建书签
  async bookmarkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab.url && tab.title) {
      const bookmark = await api.bookmarks.createBookmark({
        url: tab.url,
        title: tab.title,
        parentId: null,
        sortOrder: Date.now(),
        metadata: {
          favicon: tab.favIconUrl
        }
      })

      console.log("书签创建成功:", bookmark)
    }
  },

  // 批量导入书签
  async importBookmarks(bookmarksData: CreateBookmarkDto[]) {
    const results = await api.bookmarks.batchCreateBookmarks(bookmarksData)

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`导入完成: ${successful} 成功, ${failed} 失败`)
  },

  // 获取书签树
  async showBookmarkTree() {
    const tree = await api.bookmarks.getBookmarkTree()

    const printTree = (bookmarks: any[], level = 0) => {
      bookmarks.forEach((bookmark) => {
        const indent = "  ".repeat(level)
        console.log(`${indent}${bookmark.title}`)

        if (bookmark.children && bookmark.children.length > 0) {
          printTree(bookmark.children, level + 1)
        }
      })
    }

    printTree(tree)
  }
}

// 历史记录示例
export const historyExamples = {
  // 获取最近访问的网站
  async showRecentHistory() {
    const history = await api.history.getRecentHistory(20)

    console.log("最近访问的网站:")
    history.forEach((item) => {
      const date = new Date(item.lastVisitTime).toLocaleString()
      console.log(`${date} - ${item.title} (${item.visitCount} 次访问)`)
    })
  },

  // 搜索历史记录
  async searchHistory(keyword: string) {
    const results = await api.history.searchHistory({
      query: keyword,
      maxResults: 10,
      searchFields: ["title", "url"]
    })

    console.log(`搜索 "${keyword}" 找到 ${results.data?.total} 条结果:`)
    results.data?.results.forEach((item) => {
      console.log(`- ${item.title} (相关度: ${item.relevanceScore.toFixed(2)})`)
    })
  },

  // 获取访问统计
  async showStats() {
    const stats = await api.history.getHistoryStats({ period: "week" })

    if (stats.data) {
      console.log("本周访问统计:")
      console.log(`总访问次数: ${stats.data.totalVisits}`)
      console.log(`唯一网站: ${stats.data.uniqueUrls}`)
      console.log("热门域名:")

      stats.data.topDomains.slice(0, 5).forEach((domain) => {
        console.log(
          `  ${domain.domain}: ${domain.visitCount} 次 (${domain.percentage.toFixed(1)}%)`
        )
      })
    }
  },

  // 从 Chrome 导入历史记录
  async importChromeHistory() {
    try {
      // 获取 Chrome 历史记录
      const chromeHistory = await chrome.history.search({
        text: "",
        maxResults: 1000,
        startTime: Date.now() - 30 * 24 * 60 * 60 * 1000 // 最近30天
      })

      console.log(`准备导入 ${chromeHistory.length} 条历史记录...`)

      const result = await api.history.importFromChrome(chromeHistory)

      console.log("导入完成:")
      console.log(`- 新创建: ${result.created}`)
      console.log(`- 更新: ${result.updated}`)
      console.log(`- 总处理: ${result.total}`)
    } catch (error) {
      console.error("导入失败:", error)
    }
  },

  // 清理旧历史记录
  async cleanOldHistory(daysToKeep = 90) {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000

    const result = await api.history.clearHistory({
      confirm: true,
      endTime: cutoffTime
    })

    console.log(
      `清理了 ${result.data?.affected} 条 ${daysToKeep} 天前的历史记录`
    )
  }
}

// 团队示例
export const teamExamples = {
  // 创建团队
  async createTeam() {
    const team = await api.teams.createTeam({
      name: "前端开发团队",
      description: "专注于前端技术的团队",
      settings: {
        allowMemberEdit: true,
        allowMemberInvite: false
      }
    })

    console.log("团队创建成功:", team)
  },

  // 管理团队书签
  async manageTeamBookmarks(teamId: string) {
    // 获取团队书签
    const bookmarks = await api.bookmarks.getTeamBookmarks(teamId)
    console.log(`团队有 ${bookmarks.length} 个书签`)

    // 添加团队书签
    await api.bookmarks.createTeamBookmark(teamId, {
      url: "https://reactjs.org",
      title: "React 官方文档",
      parentId: null,
      sortOrder: 0,
      metadata: {
        description: "团队必读的 React 文档"
      }
    })

    console.log("团队书签添加成功")
  },

  // 检查团队权限
  async checkPermissions(teamId: string) {
    const permissions = await api.teams.checkTeamPermission(teamId)

    console.log("团队权限:")
    console.log(`- 角色: ${permissions.role}`)
    console.log(`- 可编辑: ${permissions.canEdit}`)
    console.log(`- 可邀请: ${permissions.canInvite}`)
    console.log(`- 可管理: ${permissions.canManage}`)
  }
}

// 综合使用示例
export const advancedExamples = {
  // 智能书签推荐
  async smartBookmarkRecommendation() {
    // 获取最常访问的网站
    const mostVisited = await api.history.getMostVisitedSites(10)

    // 获取现有书签
    const bookmarks = await api.bookmarks.getBookmarks()
    const bookmarkedUrls = new Set(bookmarks.map((b) => b.url))

    // 推荐未收藏的常访问网站
    const recommendations = mostVisited.filter(
      (site) => !bookmarkedUrls.has(site.url)
    )

    console.log("推荐收藏的网站:")
    recommendations.forEach((site) => {
      console.log(`- ${site.title} (访问 ${site.visitCount} 次)`)
    })

    return recommendations
  },

  // 数据同步
  async syncData() {
    try {
      console.log("开始数据同步...")

      // 1. 同步书签
      const bookmarks = await api.bookmarks.getBookmarks()
      console.log(`同步了 ${bookmarks.length} 个书签`)

      // 2. 同步最近历史记录
      const recentHistory = await api.history.getRecentHistory(100)
      console.log(`同步了 ${recentHistory.length} 条历史记录`)

      // 3. 获取统计信息
      const stats = await api.history.getHistoryStats({ period: "week" })
      console.log(`本周访问了 ${stats.data?.totalVisits} 个页面`)

      console.log("数据同步完成")
    } catch (error) {
      console.error("数据同步失败:", error)
    }
  },

  // 数据备份
  async backupData() {
    const backup = {
      timestamp: new Date().toISOString(),
      bookmarks: await api.bookmarks.getBookmarks(),
      recentHistory: await api.history.getRecentHistory(1000),
      teams: await api.teams.getTeams()
    }

    // 保存到本地存储
    await chrome.storage.local.set({ backup })

    console.log("数据备份完成:", {
      bookmarks: backup.bookmarks.length,
      history: backup.recentHistory.length,
      teams: backup.teams.length
    })

    return backup
  },

  // 数据恢复
  async restoreData() {
    const { backup } = await chrome.storage.local.get(["backup"])

    if (!backup) {
      console.log("没有找到备份数据")
      return
    }

    console.log("开始恢复数据...")

    // 恢复书签
    if (backup.bookmarks) {
      const bookmarkResults = await api.bookmarks.batchCreateBookmarks(
        backup.bookmarks
      )
      const successful = bookmarkResults.filter((r) => r.success).length
      console.log(`恢复了 ${successful} 个书签`)
    }

    // 恢复历史记录
    if (backup.recentHistory) {
      const historyItems: HistoryBatchAddItem[] = backup.recentHistory.map(
        (item: any) => ({
          url: item.url,
          title: item.title,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount,
          typedCount: item.typedCount
        })
      )

      const historyResult = await api.history.batchAddHistory(historyItems)
      console.log(`恢复了 ${historyResult.data?.total} 条历史记录`)
    }

    console.log("数据恢复完成")
  }
}

// 错误处理示例
export const errorHandlingExamples = {
  // 统一错误处理
  async handleApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
    try {
      return await apiCall()
    } catch (error: any) {
      if (error.message.includes("401")) {
        console.log("认证失败，需要重新登录")
        api.removeToken()
        // 重定向到登录页面
      } else if (error.message.includes("403")) {
        console.log("权限不足")
      } else if (error.message.includes("429")) {
        console.log("请求过于频繁，请稍后再试")
      } else {
        console.error("API 调用失败:", error.message)
      }
      return null
    }
  },

  // 使用示例
  async safeGetBookmarks() {
    const bookmarks = await this.handleApiCall(() =>
      api.bookmarks.getBookmarks()
    )

    if (bookmarks) {
      console.log("获取书签成功:", bookmarks.length)
    } else {
      console.log("获取书签失败")
    }
  }
}

// 标签页搜索示例
export const tabSearchExamples = {
  // 获取默认搜索推荐
  async getDefaultRecommendations() {
    console.log("=== 获取默认标签页推荐 ===")
    return await getDefaultTabRecommendations()
  },

  // 获取智能推荐
  async getSmartRecommendations() {
    console.log("=== 获取智能标签页推荐 ===")
    return await getSmartTabRecommendations()
  },

  // 运行完整示例
  async runFullExample() {
    console.log("=== 运行完整标签页搜索示例 ===")
    await tabSearchExampleUsage()
  }
}
