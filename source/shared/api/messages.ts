import { sendToBackground } from "@plasmohq/messaging"

// 导入类型定义
import type {
  CloseTabRequest,
  CloseTabResponse
} from "../../../background/messages/close-tab"
// 云书签相关类型定义和函数
import type {
  CloudBookmarkActionRequest,
  CloudBookmarkActionResponse
} from "../../../background/messages/cloud-bookmark-action"
import type { GetDefaultSearchTabsRequest } from "../../../background/messages/get-default-search-tabs"
import type {
  GetTabsRequest,
  GetTabsResponse
} from "../../../background/messages/get-tabs"
import type {
  SwitchTabRequest,
  SwitchTabResponse
} from "../../../background/messages/switch-tab"
import type { UserSettings } from "../types/settings"
import type {
  AuthResponse,
  AuthUser,
  Bookmark,
  CreateBookmarkDto,
  LoginRequest,
  RegisterRequest,
  UpdateBookmarkDto
} from "./types"

/**
 * Messaging API 服务
 *
 * 架构说明：
 * - 封装所有与 background script 的通信
 * - 提供类型安全的消息发送接口
 * - UI 组件通过此模块与 background 通信，获取 Chrome API 数据
 * - 遵循 UI → Messages → Background → Chrome API 的数据流向
 */

/**
 * 获取所有标签页
 */
export const getTabs = async (
  request: GetTabsRequest = {}
): Promise<GetTabsResponse> => {
  return await sendToBackground<GetTabsRequest, GetTabsResponse>({
    body: request,
    name: "get-tabs"
  })
}

/**
 * 切换到指定标签页
 */
export const switchToTab = async (
  request: SwitchTabRequest
): Promise<SwitchTabResponse> => {
  return await sendToBackground<SwitchTabRequest, SwitchTabResponse>({
    name: "switch-tab",
    body: request
  })
}

/**
 * 关闭指定标签页
 */
export const closeTab = async (
  request: CloseTabRequest
): Promise<CloseTabResponse> => {
  return await sendToBackground<CloseTabRequest, CloseTabResponse>({
    name: "close-tab",
    body: request
  })
}

/**
 * 获取默认搜索结果标签页
 * 返回最近访问的前2条和访问次数最多的前5条
 * @deprecated 请使用 getDefaultHistoryTop7 替代
 */
export const getDefaultSearchTabs = async (
  request: GetDefaultSearchTabsRequest = {}
): Promise<any> => {
  return await sendToBackground({
    name: "get-default-search-tabs" as const,
    body: request
  })
}

// 本地历史记录相关类型定义
export interface GetLocalHistoryRequest {
  type: "mostVisited" | "recentVisits" | "search"
  limit?: number
  query?: string
}

export interface GetLocalHistoryResponse {
  success: boolean
  data?: Array<{
    url: string
    title: string
    domain: string
    visitCount: number
    lastVisitTime: number
    firstVisitTime: number
    favicon?: string
  }>
  error?: string
}

export interface GetLocalHistoryStatsRequest {
  // 暂时不需要参数
}

export interface GetLocalHistoryStatsResponse {
  success: boolean
  data?: {
    totalVisits: number
    uniqueUrls: number
    topDomains: Array<{
      domain: string
      visitCount: number
      percentage: number
    }>
    recentVisits: Array<{
      url: string
      title: string
      domain: string
      visitCount: number
      lastVisitTime: number
      firstVisitTime: number
      favicon?: string
    }>
  }
  error?: string
}

export interface CleanLocalHistoryRequest {
  action: "cleanExpired" | "deleteRecord" | "clearAll"
  daysToKeep?: number
  url?: string
}

export interface CleanLocalHistoryResponse {
  success: boolean
  deletedCount?: number
  error?: string
}

/**
 * 获取本地访问历史记录
 */
export const getLocalHistory = async (
  request: GetLocalHistoryRequest
): Promise<GetLocalHistoryResponse> => {
  return await sendToBackground({
    name: "get-local-history" as const,
    body: request
  })
}

/**
 * 获取本地历史统计信息
 */
export const getLocalHistoryStats = async (
  request: GetLocalHistoryStatsRequest = {}
): Promise<GetLocalHistoryStatsResponse> => {
  return await sendToBackground({
    name: "get-local-history-stats" as const,
    body: request
  })
}

/**
 * 清理本地历史记录
 */
export const cleanLocalHistory = async (
  request: CleanLocalHistoryRequest
): Promise<CleanLocalHistoryResponse> => {
  return await sendToBackground({
    name: "clean-local-history" as const,
    body: request
  })
}

// 获取本地历史访问次数 Top7 相关类型定义
export interface GetDefaultHistoryTop7Request {
  excludeCurrentTab?: boolean
}

export interface GetDefaultHistoryTop7Response {
  success: boolean
  data: Array<{
    url: string
    title: string
    domain: string
    visitCount: number
    lastVisitTime: number
    firstVisitTime: number
    favicon?: string
  }>
  total: number
  error?: string
}

/**
 * 获取本地历史访问次数前7的数据
 */
export const getDefaultHistoryTop7 = async (
  request: GetDefaultHistoryTop7Request = {}
): Promise<GetDefaultHistoryTop7Response> => {
  return await sendToBackground({
    name: "get-default-history-top7" as const,
    body: request
  })
}

/**
 * 云书签操作 - 通用调用函数
 */
export const cloudBookmarkAction = async (
  request: CloudBookmarkActionRequest
): Promise<CloudBookmarkActionResponse> => {
  return await sendToBackground({
    name: "cloud-bookmark-action" as const,
    body: request
  })
}

// 个人书签操作封装函数

/**
 * 获取个人书签列表
 */
export const getCloudBookmarks = async (): Promise<Bookmark[]> => {
  const response = await cloudBookmarkAction({
    action: "getBookmarks"
  })

  if (!response.success) {
    throw new Error(response.error || "获取云书签失败")
  }

  return response.data
}

/**
 * 创建个人书签
 */
export const createCloudBookmark = async (
  data: CreateBookmarkDto
): Promise<Bookmark> => {
  const response = await cloudBookmarkAction({
    action: "createBookmark",
    data
  })

  if (!response.success) {
    throw new Error(response.error || "创建云书签失败")
  }

  return response.data
}

/**
 * 更新个人书签
 */
export const updateCloudBookmark = async (
  bookmarkId: string,
  data: UpdateBookmarkDto
): Promise<Bookmark> => {
  const response = await cloudBookmarkAction({
    action: "updateBookmark",
    bookmarkId,
    data
  })

  if (!response.success) {
    throw new Error(response.error || "更新云书签失败")
  }

  return response.data
}

/**
 * 删除个人书签
 */
export const deleteCloudBookmark = async (
  bookmarkId: string
): Promise<void> => {
  const response = await cloudBookmarkAction({
    action: "deleteBookmark",
    bookmarkId
  })

  if (!response.success) {
    throw new Error(response.error || "删除云书签失败")
  }
}

// 团队书签操作封装函数

/**
 * 获取团队书签列表
 */
export const getTeamCloudBookmarks = async (
  teamId: string
): Promise<Bookmark[]> => {
  const response = await cloudBookmarkAction({
    action: "getTeamBookmarks",
    teamId
  })

  if (!response.success) {
    throw new Error(response.error || "获取团队云书签失败")
  }

  return response.data
}

/**
 * 创建团队书签
 */
export const createTeamCloudBookmark = async (
  teamId: string,
  data: CreateBookmarkDto
): Promise<Bookmark> => {
  const response = await cloudBookmarkAction({
    action: "createTeamBookmark",
    teamId,
    data
  })

  if (!response.success) {
    throw new Error(response.error || "创建团队云书签失败")
  }

  return response.data
}

/**
 * 更新团队书签
 */
export const updateTeamCloudBookmark = async (
  teamId: string,
  bookmarkId: string,
  data: UpdateBookmarkDto
): Promise<Bookmark> => {
  const response = await cloudBookmarkAction({
    action: "updateTeamBookmark",
    teamId,
    bookmarkId,
    data
  })

  if (!response.success) {
    throw new Error(response.error || "更新团队云书签失败")
  }

  return response.data
}

/**
 * 删除团队书签
 */
export const deleteTeamCloudBookmark = async (
  teamId: string,
  bookmarkId: string
): Promise<void> => {
  const response = await cloudBookmarkAction({
    action: "deleteTeamBookmark",
    teamId,
    bookmarkId
  })

  if (!response.success) {
    throw new Error(response.error || "删除团队云书签失败")
  }
}

// 实用方法封装函数

/**
 * 根据 URL 查找书签
 */
export const findCloudBookmarkByUrl = async (
  url: string
): Promise<Bookmark | null> => {
  const response = await cloudBookmarkAction({
    action: "findBookmarkByUrl",
    url
  })

  if (!response.success) {
    throw new Error(response.error || "查找云书签失败")
  }

  return response.data
}

/**
 * 批量创建书签
 */
export const batchCreateCloudBookmarks = async (
  bookmarks: CreateBookmarkDto[]
): Promise<any[]> => {
  const response = await cloudBookmarkAction({
    action: "batchCreateBookmarks",
    data: bookmarks
  })

  if (!response.success) {
    throw new Error(response.error || "批量创建云书签失败")
  }

  return response.data
}

/**
 * 获取书签树结构
 */
export const getCloudBookmarkTree = async (): Promise<Bookmark[]> => {
  const response = await cloudBookmarkAction({
    action: "getBookmarkTree"
  })

  if (!response.success) {
    throw new Error(response.error || "获取云书签树失败")
  }

  return response.data
}

// ===== 用户配置文件相关 API =====

// 用户配置文件相关类型定义
export interface UserProfileActionRequest {
  action:
    | "getCurrentUser"
    | "getUserSettings"
    | "updateUserSettings"
    | "updateProfile"
    | "checkAuthStatus"
    | "login"
    | "register"
    | "logout"
    | "getUserProfile"
    | "syncProfile"
    | "clearCache"
  data?: any
}

export interface UserProfileActionResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * 用户配置文件操作
 * 通过 background 处理所有用户相关的 API 调用
 */
export const userProfileAction = async (
  request: UserProfileActionRequest
): Promise<UserProfileActionResponse> => {
  console.log("userProfileAction request:", request)
  return await sendToBackground({
    name: "user-profile-action" as const,
    body: request
  })
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  const response = await userProfileAction({
    action: "getCurrentUser"
  })

  if (!response.success) {
    throw new Error(response.error || "获取用户信息失败")
  }

  return response.data
}

/**
 * 获取用户设置
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await userProfileAction({
    action: "getUserSettings"
  })

  if (!response.success) {
    throw new Error(response.error || "获取用户设置失败")
  }

  return response.data
}

/**
 * 更新用户设置
 */
export const updateUserSettings = async (
  settings: Partial<UserSettings>
): Promise<UserSettings> => {
  const response = await userProfileAction({
    action: "updateUserSettings",
    data: settings
  })

  if (!response.success) {
    throw new Error(response.error || "更新用户设置失败")
  }

  return response.data
}

/**
 * 更新用户资料
 */
export const updateUserProfile = async (
  userData: Partial<AuthUser>
): Promise<AuthResponse> => {
  const response = await userProfileAction({
    action: "updateProfile",
    data: userData
  })

  if (!response.success) {
    throw new Error(response.error || "更新用户资料失败")
  }

  return response.data
}

/**
 * 检查认证状态
 */
export const checkAuthStatus = async (): Promise<{
  authenticated: boolean
  user?: AuthUser
}> => {
  const response = await userProfileAction({
    action: "checkAuthStatus"
  })

  if (!response.success) {
    throw new Error(response.error || "检查认证状态失败")
  }

  return response.data
}

/**
 * 用户登录
 */
export const loginUser = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  const response = await userProfileAction({
    action: "login",
    data: credentials
  })

  if (!response.success) {
    throw new Error(response.error || "登录失败")
  }

  return response.data
}

/**
 * 用户注册
 */
export const registerUser = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  const response = await userProfileAction({
    action: "register",
    data: userData
  })

  if (!response.success) {
    throw new Error(response.error || "注册失败")
  }

  return response.data
}

/**
 * 用户登出
 */
export const logoutUser = async (): Promise<{ success: boolean }> => {
  const response = await userProfileAction({
    action: "logout"
  })

  if (!response.success) {
    throw new Error(response.error || "登出失败")
  }

  return response.data
}
