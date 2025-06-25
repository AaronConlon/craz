// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginationInfo {
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface ApiResponseWithPagination<T = any> extends ApiResponse<T> {
  pagination?: PaginationInfo
}

// 书签相关类型
export interface Bookmark {
  id: string
  url: string | null
  title: string
  parentId: string | null
  sortOrder: number
  dateAdded: number
  dateModified: number
  metadata: {
    keywords?: string[]
    description?: string
    ogImage?: string
    ogTitle?: string
    ogDescription?: string
    favicon?: string
  }
  userId?: string
  teamId?: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkDto {
  url: string | null
  title: string
  parentId: string | null
  sortOrder: number
  metadata?: Bookmark["metadata"]
}

export interface UpdateBookmarkDto extends Partial<CreateBookmarkDto> {}

export interface BookmarkResponse {
  success: boolean
  id?: string
  affected?: number
  error?: string
}

// 历史记录相关类型
export interface HistoryItem {
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

export interface HistorySearchResult extends HistoryItem {
  relevanceScore: number
}

export interface HistoryStats {
  totalVisits: number
  uniqueUrls: number
  topDomains: Array<{
    domain: string
    visitCount: number
    percentage: number
  }>
  dailyStats: Array<{
    date: string
    visits: number
    uniqueUrls: number
  }>
}

export interface HistoryQueryParams {
  text?: string
  startTime?: number
  endTime?: number
  maxResults?: number
  offset?: number
  order?: "asc" | "desc"
}

export interface HistorySearchParams {
  query: string
  maxResults?: number
  startTime?: number
  endTime?: number
  searchFields?: ("title" | "url")[]
}

export interface HistoryBatchDeleteParams {
  ids?: string[]
  urlPattern?: string
  startTime?: number
  endTime?: number
}

export interface HistoryBatchAddItem {
  url: string
  title: string
  lastVisitTime: number
  visitCount?: number
  typedCount?: number
}

export interface HistoryBatchAddResponse {
  created: number
  updated: number
  total: number
}

export interface HistorySearchResponse {
  results: HistorySearchResult[]
  total: number
  searchTime: number
}

export interface HistoryStatsParams {
  period?: "day" | "week" | "month" | "year"
  startTime?: number
  endTime?: number
}

export interface HistoryClearParams {
  confirm: boolean
  startTime?: number
  endTime?: number
}

// 认证相关类型
export interface AuthUser {
  id: string
  email: string
  name: string
  username?: string // 用户名，可能与 name 不同
  avatar?: string
  isSponsored?: boolean
  receiveOfficialMessages?: boolean
  settings?: {
    theme?: string
    language?: string
    fontSize?: string
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  data: {
    user?: AuthUser
    token?: string
  }
  message?: string
  success: boolean
  timestamp: string
  error?: string
}

// 团队相关类型
export interface Team {
  id: string
  name: string
  description?: string
  settings: {
    allowMemberEdit: boolean
    allowMemberInvite: boolean
  }
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: "owner" | "admin" | "member"
  joinedAt: string
}

export interface CreateTeamDto {
  name: string
  description?: string
  settings?: Team["settings"]
}

export interface UpdateTeamDto extends Partial<CreateTeamDto> {}
