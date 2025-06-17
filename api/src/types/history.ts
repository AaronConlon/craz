/**
 * Chrome History API 类型定义
 *
 * 基于 Chrome History API 的原始数据格式，
 * 提供完整的 TypeScript 类型支持
 */

// 基础历史记录项目类型
export interface HistoryItem {
  id: string // 唯一标识符
  url: string // 页面URL
  title: string // 页面标题
  lastVisitTime: number // 最后访问时间戳 (毫秒)
  visitCount: number // 访问次数
  typedCount: number // 直接输入URL的次数
  userId: string // 用户ID
  createdAt: string // 创建时间 (ISO字符串)
  updatedAt: string // 更新时间 (ISO字符串)
}

// 创建历史记录时的输入类型
export interface CreateHistoryItemInput {
  url: string
  title: string
  lastVisitTime: number
  visitCount?: number // 默认为1
  typedCount?: number // 默认为0
}

// 更新历史记录时的输入类型
export interface UpdateHistoryItemInput {
  title?: string
  lastVisitTime?: number
  visitCount?: number
  typedCount?: number
}

// 批量创建历史记录的输入类型
export interface BatchCreateHistoryInput {
  items: CreateHistoryItemInput[]
}

// 历史记录搜索结果（包含相关性评分）
export interface HistorySearchResult extends HistoryItem {
  relevanceScore: number // 搜索相关性评分 (0-1)
}

// 搜索请求参数
export interface HistorySearchQuery {
  query: string // 搜索关键词
  maxResults?: number // 最大结果数，默认50
  startTime?: number // 可选：开始时间
  endTime?: number // 可选：结束时间
  searchFields?: ("title" | "url")[] // 搜索字段，默认both
}

// 批量删除请求参数
export interface BatchDeleteHistoryInput {
  ids?: string[] // 要删除的ID列表
  urlPattern?: string // 按URL模式删除
  startTime?: number // 按时间范围删除 - 开始时间
  endTime?: number // 按时间范围删除 - 结束时间
}

// 清空历史记录请求参数
export interface ClearHistoryInput {
  confirm: true // 必须为true确认清空
  startTime?: number // 可选：只清空指定时间范围
  endTime?: number // 可选：只清空指定时间范围
}

// 域名统计信息
export interface DomainStats {
  domain: string // 域名
  visitCount: number // 访问次数
  percentage: number // 占总访问的百分比
}

// 每日统计信息
export interface DailyStats {
  date: string // 日期 (YYYY-MM-DD 格式)
  visits: number // 当日访问次数
  uniqueUrls: number // 当日唯一URL数量
}

// 访问统计信息
export interface HistoryStats {
  totalVisits: number // 总访问次数
  uniqueUrls: number // 唯一URL数量
  topDomains: DomainStats[] // 热门域名列表
  dailyStats: DailyStats[] // 每日统计数据
}

// 分页信息
export interface PaginationInfo {
  total: number // 总记录数
  offset: number // 当前偏移量
  limit: number // 每页限制
  hasMore: boolean // 是否有更多数据
}

// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 历史记录列表响应
export interface HistoryListResponse extends ApiResponse<HistoryItem[]> {
  data: HistoryItem[]
  pagination: PaginationInfo
}

// 单个历史记录响应
export interface HistoryItemResponse extends ApiResponse<HistoryItem> {
  data: HistoryItem
}

// 搜索响应
export interface HistorySearchResponse extends ApiResponse {
  data: {
    results: HistorySearchResult[]
    total: number
    searchTime: number // 搜索耗时 (毫秒)
  }
}

// 统计响应
export interface HistoryStatsResponse extends ApiResponse<HistoryStats> {
  data: HistoryStats
}

// 批量操作响应
export interface BatchOperationResponse extends ApiResponse {
  data: {
    created?: number // 创建的记录数
    updated?: number // 更新的记录数
    total?: number // 总处理记录数
    affected?: number // 受影响的记录数
  }
}

// 查询参数类型
export interface HistoryQueryParams {
  text?: string // 搜索文本
  startTime?: number // 开始时间戳
  endTime?: number // 结束时间戳
  maxResults?: number // 最大返回数量
  offset?: number // 分页偏移量
  order?: "asc" | "desc" // 排序方向
}

// 统计查询参数
export interface StatsQueryParams {
  period?: "day" | "week" | "month" | "year" // 统计周期
  startTime?: number // 开始时间戳
  endTime?: number // 结束时间戳
}

// 历史记录保留策略
export interface HistoryRetentionPolicy {
  userId: string
  maxDays: number // 最多保留天数
  maxEntries: number // 最多保留条目数
  autoCleanup: boolean // 是否自动清理
  createdAt: string
  updatedAt: string
}

// Chrome History API 原始格式（用于数据迁移和兼容性）
export interface ChromeHistoryItem {
  id?: string // Chrome 历史记录ID (可选)
  url: string // 页面URL
  title?: string // 页面标题 (可选)
  lastVisitTime?: number // 最后访问时间戳
  visitCount?: number // 访问次数
  typedCount?: number // 直接输入次数
}

// 搜索字段枚举
export type SearchField = "title" | "url"

// 排序方向枚举
export type SortOrder = "asc" | "desc"

// 统计周期枚举
export type StatsPeriod = "day" | "week" | "month" | "year"

// 数据库查询结果类型（内部使用）
export interface DBHistoryItem {
  id: string
  url: string
  title: string
  lastVisitTime: number
  visitCount: number
  typedCount: number
  userId: string
  createdAt: string
  updatedAt: string
}

// FTS5 搜索结果类型（内部使用）
export interface FTSSearchResult extends DBHistoryItem {
  relevanceScore: number
}

// 所有接口和类型已经通过 export 关键字导出，无需重复导出
