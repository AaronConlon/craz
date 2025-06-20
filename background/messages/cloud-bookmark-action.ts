import type { PlasmoMessaging } from "@plasmohq/messaging"

import { createCrazApiFromEnv } from "~/source/shared/api"
import type {
  Bookmark,
  BookmarkResponse,
  CreateBookmarkDto,
  UpdateBookmarkDto
} from "~/source/shared/api/types"

/**
 * Chrome 扩展架构说明：Background 作为服务中间层
 *
 * 数据流向：UI 组件 → Background (此处) → 云端 API → Background → UI
 *
 * 职责分离：
 * - UI 负责展示和用户交互
 * - Background 负责所有云端 API 调用和数据处理
 * - 通过 @plasmohq/messaging 进行通信
 */

// 云书签操作类型
export type CloudBookmarkAction =
  | "getBookmarks"
  | "createBookmark"
  | "updateBookmark"
  | "deleteBookmark"
  | "getTeamBookmarks"
  | "createTeamBookmark"
  | "updateTeamBookmark"
  | "deleteTeamBookmark"
  | "findBookmarkByUrl"
  | "batchCreateBookmarks"
  | "getBookmarkTree"

// 请求类型定义
export interface CloudBookmarkActionRequest {
  action: CloudBookmarkAction
  data?: any
  teamId?: string
  bookmarkId?: string
  url?: string
}

// 响应类型定义
export interface CloudBookmarkActionResponse {
  success: boolean
  data?: any
  error?: string
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { action, data, teamId, bookmarkId, url } =
    req.body as CloudBookmarkActionRequest

  console.log("[Background] 云书签操作请求:", { action, teamId, bookmarkId })

  try {
    // 初始化 API 客户端
    const api = createCrazApiFromEnv()

    let result: any

    switch (action) {
      // 个人书签操作
      case "getBookmarks":
        result = await api.bookmarks.getBookmarks()
        break

      case "createBookmark":
        if (!data) throw new Error("缺少书签数据")
        result = await api.bookmarks.createBookmark(data as CreateBookmarkDto)
        break

      case "updateBookmark":
        if (!bookmarkId || !data) throw new Error("缺少书签ID或数据")
        result = await api.bookmarks.updateBookmark(
          bookmarkId,
          data as UpdateBookmarkDto
        )
        break

      case "deleteBookmark":
        if (!bookmarkId) throw new Error("缺少书签ID")
        result = await api.bookmarks.deleteBookmark(bookmarkId)
        break

      // 团队书签操作
      case "getTeamBookmarks":
        if (!teamId) throw new Error("缺少团队ID")
        result = await api.bookmarks.getTeamBookmarks(teamId)
        break

      case "createTeamBookmark":
        if (!teamId || !data) throw new Error("缺少团队ID或书签数据")
        result = await api.bookmarks.createTeamBookmark(
          teamId,
          data as CreateBookmarkDto
        )
        break

      case "updateTeamBookmark":
        if (!teamId || !bookmarkId || !data)
          throw new Error("缺少团队ID、书签ID或数据")
        result = await api.bookmarks.updateTeamBookmark(
          teamId,
          bookmarkId,
          data as UpdateBookmarkDto
        )
        break

      case "deleteTeamBookmark":
        if (!teamId || !bookmarkId) throw new Error("缺少团队ID或书签ID")
        result = await api.bookmarks.deleteTeamBookmark(teamId, bookmarkId)
        break

      // 实用方法
      case "findBookmarkByUrl":
        if (!url) throw new Error("缺少URL参数")
        result = await api.bookmarks.findBookmarkByUrl(url)
        break

      case "batchCreateBookmarks":
        if (!data || !Array.isArray(data)) throw new Error("缺少书签数组数据")
        result = await api.bookmarks.batchCreateBookmarks(
          data as CreateBookmarkDto[]
        )
        break

      case "getBookmarkTree":
        result = await api.bookmarks.getBookmarkTree()
        break

      default:
        throw new Error(`不支持的操作: ${action}`)
    }

    console.log("[Background] 云书签操作成功:", {
      action,
      resultType: typeof result
    })

    res.send({
      success: true,
      data: result
    } as CloudBookmarkActionResponse)
  } catch (error) {
    console.error("[Background] 云书签操作失败:", error)

    res.send({
      success: false,
      error: error instanceof Error ? error.message : "云书签操作失败"
    } as CloudBookmarkActionResponse)
  }
}

export default handler
