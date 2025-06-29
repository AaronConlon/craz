import axios, { AxiosInstance } from "axios";
import { z } from "zod";





// 测试配置
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_API_URL || "http://localhost:8787",
  timeout: 10000,
  retries: 3
}

/**
 * API 响应验证工具
 */
export class ResponseValidator {
  /**
   * 验证响应状态码和数据结构
   */
  static async validate<T>(
    response: Response,
    expectedStatus: number,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    // 检查状态码
    if (response.status !== expectedStatus) {
      const errorText = await response.text()
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Response: ${errorText}`
      )
    }

    // 解析 JSON
    let data: any
    try {
      data = await response.json()
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`)
    }

    // 验证数据结构
    try {
      return schema.parse(data)
    } catch (error) {
      throw new Error(
        `Response validation failed: ${error}. Data: ${JSON.stringify(data, null, 2)}`
      )
    }
  }

  /**
   * 验证错误响应
   */
  static async validateError(
    response: Response,
    expectedStatus: number,
    expectedMessage?: string
  ): Promise<any> {
    if (response.status !== expectedStatus) {
      const errorText = await response.text()
      throw new Error(
        `Expected error status ${expectedStatus}, got ${response.status}. Response: ${errorText}`
      )
    }

    const data = await response.json()

    if (data.success !== false) {
      throw new Error(`Expected success: false, got success: ${data.success}`)
    }

    if (expectedMessage && !data.message.includes(expectedMessage)) {
      throw new Error(
        `Expected message to contain "${expectedMessage}", got: "${data.message}"`
      )
    }

    return data
  }
}

/**
 * API 请求工具
 */
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = TEST_CONFIG.baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "") // 移除末尾斜杠
  }

  /**
   * 基础请求方法
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`

    const defaultOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }

    console.log(`🔄 ${options.method || "GET"} ${url}`)

    const response = await fetch(url, defaultOptions)

    console.log(`✅ ${response.status} ${response.statusText}`)

    return response
  }

  /**
   * GET 请求
   */
  async get(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(endpoint, { method: "GET", headers })
  }

  /**
   * POST 请求
   */
  async post(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    const serializedBody = body ? JSON.stringify(body) : undefined

    return this.request(endpoint, {
      method: "POST",
      body: serializedBody,
      headers
    })
  }

  /**
   * PUT 请求
   */
  async put(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers
    })
  }

  /**
   * DELETE 请求
   */
  async delete(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(endpoint, { method: "DELETE", headers })
  }

  /**
   * OPTIONS 请求 (CORS)
   */
  async options(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(endpoint, { method: "OPTIONS", headers })
  }

  /**
   * 带认证头的请求
   */
  async authenticatedRequest(
    method: string,
    endpoint: string,
    token: string,
    body?: any
  ): Promise<Response> {
    return this.request(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    })
  }
}

/**
 * 认证相关 API 客户端
 */
export class AuthApiClient extends ApiClient {
  // 健康检查
  async health(): Promise<Response> {
    return this.get("/api/auth/health")
  }

  // 用户注册
  async register(userData: {
    username: string
    email: string
    password: string
    receiveOfficialMessages?: boolean
  }): Promise<Response> {
    return this.post("/api/auth/register", userData)
  }

  // 用户登录
  async login(credentials: {
    email: string
    password: string
  }): Promise<Response> {
    return this.post("/api/auth/login", credentials)
  }

  // 获取用户信息
  async me(token: string): Promise<Response> {
    return this.authenticatedRequest("GET", "/api/auth/me", token)
  }

  // 更新用户设置
  async updateSettings(
    token: string,
    settings: {
      theme?: string
      language?: string
      fontSize?: string
      receiveOfficialMessages?: boolean
    }
  ): Promise<Response> {
    return this.authenticatedRequest(
      "PUT",
      "/api/auth/settings",
      token,
      settings
    )
  }

  // 检查用户名可用性
  async checkUsernameAvailability(username: string): Promise<Response> {
    return this.get(
      `/api/auth/check-username?username=${encodeURIComponent(username)}`
    )
  }

  // 检查邮箱可用性
  async checkEmailAvailability(email: string): Promise<Response> {
    return this.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
  }

  // 刷新令牌
  async refreshToken(token: string): Promise<Response> {
    return this.authenticatedRequest("POST", "/api/auth/refresh", token)
  }
}

/**
 * 团队相关 API 客户端
 */
export class TeamApiClient extends ApiClient {
  // 健康检查
  async health(): Promise<Response> {
    return this.get("/teams/health")
  }

  // 获取团队列表
  async getTeams(
    token: string,
    params?: { page?: number; pageSize?: number; search?: string }
  ): Promise<Response> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", params.page.toString())
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString())
    if (params?.search) query.append("search", params.search)

    const url = `/api/teams${query.toString() ? `?${query.toString()}` : ""}`
    return this.authenticatedRequest("GET", url, token)
  }

  // 创建团队
  async createTeam(token: string, data: any): Promise<Response> {
    return this.authenticatedRequest("POST", "/api/teams", token, data)
  }

  // 获取单个团队
  async getTeam(token: string, teamId: string): Promise<Response> {
    return this.authenticatedRequest("GET", `/api/teams/${teamId}`, token)
  }

  // 更新团队
  async updateTeam(
    token: string,
    teamId: string,
    data: any
  ): Promise<Response> {
    return this.authenticatedRequest("PUT", `/api/teams/${teamId}`, token, data)
  }

  // 删除团队
  async deleteTeam(token: string, teamId: string): Promise<Response> {
    return this.authenticatedRequest("DELETE", `/api/teams/${teamId}`, token)
  }

  // 获取团队成员
  async getTeamMembers(
    token: string,
    teamId: string,
    params?: { page?: number; pageSize?: number; search?: string }
  ): Promise<Response> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", params.page.toString())
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString())
    if (params?.search) query.append("search", params.search)

    const url = `/api/teams/${teamId}/members${query.toString() ? `?${query.toString()}` : ""}`
    return this.authenticatedRequest("GET", url, token)
  }

  // 邀请成员
  async inviteMember(
    token: string,
    teamId: string,
    data: any
  ): Promise<Response> {
    return this.authenticatedRequest(
      "POST",
      `/api/teams/${teamId}/members`,
      token,
      data
    )
  }

  // 更新成员角色
  async updateMemberRole(
    token: string,
    teamId: string,
    memberId: string,
    data: any
  ): Promise<Response> {
    return this.authenticatedRequest(
      "PUT",
      `/api/teams/${teamId}/members/${memberId}`,
      token,
      data
    )
  }

  // 移除成员
  async removeMember(
    token: string,
    teamId: string,
    memberId: string
  ): Promise<Response> {
    return this.authenticatedRequest(
      "DELETE",
      `/api/teams/${teamId}/members/${memberId}`,
      token
    )
  }

  // 获取团队书签
  async getTeamBookmarks(
    token: string,
    teamId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<Response> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", params.page.toString())
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString())

    const url = `/api/teams/${teamId}/bookmarks${query.toString() ? `?${query.toString()}` : ""}`
    return this.authenticatedRequest("GET", url, token)
  }

  // 创建团队书签
  async createTeamBookmark(
    token: string,
    teamId: string,
    data: any
  ): Promise<Response> {
    return this.authenticatedRequest(
      "POST",
      `/api/teams/${teamId}/bookmarks`,
      token,
      data
    )
  }

  // 获取单个团队书签
  async getTeamBookmark(
    token: string,
    teamId: string,
    bookmarkId: string
  ): Promise<Response> {
    return this.authenticatedRequest(
      "GET",
      `/api/teams/${teamId}/bookmarks/${bookmarkId}`,
      token
    )
  }

  // 更新团队书签
  async updateTeamBookmark(
    token: string,
    teamId: string,
    bookmarkId: string,
    data: any
  ): Promise<Response> {
    return this.authenticatedRequest(
      "PUT",
      `/api/teams/${teamId}/bookmarks/${bookmarkId}`,
      token,
      data
    )
  }

  // 删除团队书签
  async deleteTeamBookmark(
    token: string,
    teamId: string,
    bookmarkId: string
  ): Promise<Response> {
    return this.authenticatedRequest(
      "DELETE",
      `/api/teams/${teamId}/bookmarks/${bookmarkId}`,
      token
    )
  }
}

/**
 * 书签相关 API 客户端
 */
export class BookmarkApiClient extends ApiClient {
  // 获取书签列表
  async getBookmarks(
    token: string,
    params?: {
      page?: number
      pageSize?: number
      search?: string
      tags?: string
    }
  ): Promise<Response> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set("page", params.page.toString())
    if (params?.pageSize)
      queryParams.set("pageSize", params.pageSize.toString())
    if (params?.search) queryParams.set("search", params.search)
    if (params?.tags) queryParams.set("tags", params.tags)

    const endpoint = `/api/bookmarks${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    return this.authenticatedRequest("GET", endpoint, token)
  }

  // 检查书签是否存在
  async checkBookmarkExists(token: string, url: string): Promise<Response> {
    return this.authenticatedRequest(
      "GET",
      `/api/bookmarks/check?url=${encodeURIComponent(url)}`,
      token
    )
  }

  // 搜索书签
  async searchBookmarks(
    token: string,
    query: string,
    params?: { tags?: string; limit?: number }
  ): Promise<Response> {
    const queryParams = new URLSearchParams({ q: query })
    if (params?.tags) queryParams.set("tags", params.tags)
    if (params?.limit) queryParams.set("limit", params.limit.toString())

    return this.authenticatedRequest(
      "GET",
      `/api/bookmarks/search?${queryParams.toString()}`,
      token
    )
  }

  // 获取所有标签
  async getTags(token: string): Promise<Response> {
    return this.authenticatedRequest("GET", "/api/bookmarks/tags", token)
  }

  // 获取单个书签
  async getBookmark(token: string, id: string): Promise<Response> {
    return this.authenticatedRequest("GET", `/api/bookmarks/${id}`, token)
  }

  // 创建书签
  async createBookmark(
    token: string,
    bookmarkData: {
      title: string
      url: string | null
      parentId: string | null
      sortOrder: number
      metadata?: Record<string, any>
    }
  ): Promise<Response> {
    return this.authenticatedRequest(
      "POST",
      "/api/bookmarks",
      token,
      bookmarkData
    )
  }

  // 更新书签
  async updateBookmark(
    token: string,
    id: string,
    bookmarkData: {
      title?: string
      url?: string | null
      parentId?: string | null
      sortOrder?: number
      metadata?: Record<string, any>
    }
  ): Promise<Response> {
    return this.authenticatedRequest(
      "PUT",
      `/api/bookmarks/${id}`,
      token,
      bookmarkData
    )
  }

  // 删除书签
  async deleteBookmark(token: string, id: string): Promise<Response> {
    return this.authenticatedRequest("DELETE", `/api/bookmarks/${id}`, token)
  }
}

/**
 * 主 API 客户端，包含所有子客户端
 */
/**
 * History API 客户端
 */
export class HistoryApiClient extends ApiClient {
  async health(): Promise<Response> {
    return this.get("/api/history/health")
  }

  async getHistory(
    token: string,
    params?: {
      page?: number
      pageSize?: number
      search?: string
      startTime?: number
      endTime?: number
      domain?: string
      sortBy?: "visitTime" | "lastVisitTime" | "visitCount" | "title"
      sortOrder?: "asc" | "desc"
    }
  ): Promise<Response> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.startTime)
      queryParams.append("startTime", params.startTime.toString())
    if (params?.endTime)
      queryParams.append("endTime", params.endTime.toString())
    if (params?.domain) queryParams.append("domain", params.domain)
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    const query = queryParams.toString()
    return this.authenticatedRequest(
      "GET",
      `/api/history${query ? `?${query}` : ""}`,
      token
    )
  }

  async createHistoryItem(
    token: string,
    data: {
      url: string
      title: string
      visitTime?: number
      visitCount?: number
      typedCount?: number
    }
  ): Promise<Response> {
    return this.authenticatedRequest("POST", "/api/history", token, data)
  }

  async getHistoryItem(token: string, id: string): Promise<Response> {
    return this.authenticatedRequest("GET", `/api/history/${id}`, token)
  }

  async updateHistoryItem(
    token: string,
    id: string,
    data: {
      title?: string
      visitCount?: number
      typedCount?: number
      lastVisitTime?: number
    }
  ): Promise<Response> {
    return this.authenticatedRequest("PUT", `/api/history/${id}`, token, data)
  }

  async deleteHistoryItem(token: string, id: string): Promise<Response> {
    return this.authenticatedRequest("DELETE", `/api/history/${id}`, token)
  }

  async searchHistory(
    token: string,
    params: {
      q: string
      startTime?: number
      endTime?: number
      domain?: string
      limit?: number
    }
  ): Promise<Response> {
    const queryParams = new URLSearchParams()
    queryParams.append("q", params.q)

    if (params.startTime)
      queryParams.append("startTime", params.startTime.toString())
    if (params.endTime) queryParams.append("endTime", params.endTime.toString())
    if (params.domain) queryParams.append("domain", params.domain)
    if (params.limit) queryParams.append("limit", params.limit.toString())

    return this.authenticatedRequest(
      "GET",
      `/api/history/search?${queryParams.toString()}`,
      token
    )
  }

  async batchCreateHistory(
    token: string,
    data: {
      items: Array<{
        url: string
        title: string
        visitTime?: number
        visitCount?: number
        typedCount?: number
      }>
    }
  ): Promise<Response> {
    return this.authenticatedRequest("POST", "/api/history/batch", token, data)
  }

  async batchUpdateHistory(
    token: string,
    data: {
      items: Array<{
        id: string
        data: {
          title?: string
          visitCount?: number
          typedCount?: number
          lastVisitTime?: number
        }
      }>
    }
  ): Promise<Response> {
    return this.authenticatedRequest("PUT", "/api/history/batch", token, data)
  }

  async batchDeleteHistory(
    token: string,
    data: {
      ids: string[]
    }
  ): Promise<Response> {
    return this.authenticatedRequest(
      "DELETE",
      "/api/history/batch",
      token,
      data
    )
  }

  async deleteByTimeRange(
    token: string,
    data: {
      startTime: number
      endTime: number
      domain?: string
    }
  ): Promise<Response> {
    return this.authenticatedRequest(
      "DELETE",
      "/api/history/range",
      token,
      data
    )
  }

  async getStats(
    token: string,
    params?: {
      startTime?: number
      endTime?: number
      domain?: string
      groupBy?: "day" | "week" | "month" | "domain"
    }
  ): Promise<Response> {
    const queryParams = new URLSearchParams()

    if (params?.startTime)
      queryParams.append("startTime", params.startTime.toString())
    if (params?.endTime)
      queryParams.append("endTime", params.endTime.toString())
    if (params?.domain) queryParams.append("domain", params.domain)
    if (params?.groupBy) queryParams.append("groupBy", params.groupBy)

    const query = queryParams.toString()
    return this.authenticatedRequest(
      "GET",
      `/api/history/stats${query ? `?${query}` : ""}`,
      token
    )
  }

  async getTopSites(
    token: string,
    params?: {
      startTime?: number
      endTime?: number
      limit?: number
      sortBy?: "visitCount" | "lastVisitTime"
    }
  ): Promise<Response> {
    const queryParams = new URLSearchParams()

    if (params?.startTime)
      queryParams.append("startTime", params.startTime.toString())
    if (params?.endTime)
      queryParams.append("endTime", params.endTime.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)

    const query = queryParams.toString()
    return this.authenticatedRequest(
      "GET",
      `/api/history/top-sites${query ? `?${query}` : ""}`,
      token
    )
  }
}

export class MainApiClient extends ApiClient {
  public auth: AuthApiClient
  public teams: TeamApiClient
  public bookmarks: BookmarkApiClient
  public history: HistoryApiClient

  constructor(baseUrl?: string) {
    super(baseUrl)
    this.auth = new AuthApiClient(baseUrl)
    this.teams = new TeamApiClient(baseUrl)
    this.bookmarks = new BookmarkApiClient(baseUrl)
    this.history = new HistoryApiClient(baseUrl)
  }

  // 根路径健康检查
  async health(): Promise<Response> {
    return this.get("/")
  }
}

/**
 * API 客户端配置
 */
interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * 默认 API 客户端配置
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: "http://localhost:8787",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  }
}

/**
 * 创建测试 API 客户端
 */
export function createTestApiClient(
  config: Partial<ApiClientConfig> = {}
): AxiosInstance {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  return axios.create(mergedConfig)
}
