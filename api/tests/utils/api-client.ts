import { z } from "zod"

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
    return this.get("/auth/health")
  }

  // 用户注册
  async register(userData: {
    username: string
    email: string
    password: string
    receiveOfficialMessages?: boolean
  }): Promise<Response> {
    return this.post("/auth/register", userData)
  }

  // 用户登录
  async login(credentials: {
    email: string
    password: string
  }): Promise<Response> {
    return this.post("/auth/login", credentials)
  }

  // 获取用户信息
  async me(token: string): Promise<Response> {
    return this.authenticatedRequest("GET", "/auth/me", token)
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
    return this.authenticatedRequest("PUT", "/auth/settings", token, settings)
  }

  // 检查用户名可用性
  async checkUsernameAvailability(username: string): Promise<Response> {
    return this.get(
      `/auth/check-username?username=${encodeURIComponent(username)}`
    )
  }

  // 检查邮箱可用性
  async checkEmailAvailability(email: string): Promise<Response> {
    return this.get(`/auth/check-email?email=${encodeURIComponent(email)}`)
  }

  // 刷新令牌
  async refreshToken(token: string): Promise<Response> {
    return this.authenticatedRequest("POST", "/auth/refresh", token)
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

  // TODO: 添加更多团队相关的方法
}

/**
 * 主 API 客户端，包含所有子客户端
 */
export class MainApiClient extends ApiClient {
  public auth: AuthApiClient
  public teams: TeamApiClient

  constructor(baseUrl?: string) {
    super(baseUrl)
    this.auth = new AuthApiClient(baseUrl)
    this.teams = new TeamApiClient(baseUrl)
  }

  // 根路径健康检查
  async health(): Promise<Response> {
    return this.get("/")
  }
}
