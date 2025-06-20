import ky, { type KyInstance } from "ky"

import { getApiConfig, isDevelopment } from "../config/env"

export interface ApiClientConfig {
  baseUrl?: string
  token?: string
  timeout?: number
  retryLimit?: number
  enableLogs?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class BaseApiClient {
  protected client: KyInstance
  protected config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig = {}) {
    // 合并环境变量配置和传入配置
    const envConfig = getApiConfig()
    this.config = {
      baseUrl: config.baseUrl || envConfig.baseUrl,
      token: config.token || "",
      timeout: config.timeout || envConfig.timeout,
      retryLimit: config.retryLimit || envConfig.retryLimit,
      enableLogs: config.enableLogs ?? envConfig.enableLogs
    }

    // 开发环境下输出配置信息
    if (isDevelopment && this.config.enableLogs) {
      console.log("🚀 API Client initialized with config:", {
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
        retryLimit: this.config.retryLimit,
        hasToken: !!this.config.token
      })
    }

    this.client = ky.create({
      prefixUrl: this.config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.token && {
          Authorization: `Bearer ${this.config.token}`
        })
      },
      retry: {
        limit: this.config.retryLimit,
        methods: ["get", "post", "put", "delete", "patch"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504]
      },
      timeout: this.config.timeout,
      hooks: {
        beforeError: [
          async (error) => {
            const { response } = error
            if (response && response.body) {
              try {
                const body = (await response.json()) as any
                error.message = body.error || error.message
              } catch (_) {
                // 如果响应不是 JSON 格式，保持原始错误信息
              }
            }
            return error
          }
        ]
      }
    })
  }

  protected async get<T>(endpoint: string, options?: any): Promise<T> {
    return await this.client.get(endpoint, options).json<T>()
  }

  protected async post<T>(
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T> {
    return await this.client
      .post(endpoint, { json: data, ...options })
      .json<T>()
  }

  protected async put<T>(
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T> {
    return await this.client.put(endpoint, { json: data, ...options }).json<T>()
  }

  protected async delete<T>(
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T> {
    return await this.client
      .delete(endpoint, { json: data, ...options })
      .json<T>()
  }

  setToken(token: string) {
    this.config.token = token
    this.client = this.client.extend({
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  removeToken() {
    this.config.token = undefined
    this.client = this.client.extend({
      headers: {
        Authorization: undefined
      }
    })
  }
}
