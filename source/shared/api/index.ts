// 导入 API 类
import { getApiConfig, logApiConfig } from "../config/env"
import { AuthApi } from "./auth-api"
import { BaseApiClient, type ApiClientConfig } from "./base-client"
import { BookmarksApi } from "./bookmarks-api"
import { HistoryApi } from "./history-api"
import { TeamsApi } from "./teams-api"

// 导出类型
export * from "./types"

// 导出 API 类
export { BaseApiClient } from "./base-client"
export { BookmarksApi } from "./bookmarks-api"
export { HistoryApi } from "./history-api"
export { AuthApi } from "./auth-api"
export { TeamsApi } from "./teams-api"

/**
 * Craz API 客户端主类
 * 统一管理所有 API 模块
 */
export class CrazApi {
  readonly auth: AuthApi
  readonly bookmarks: BookmarksApi
  readonly history: HistoryApi
  readonly teams: TeamsApi

  constructor(config: ApiClientConfig) {
    this.auth = new AuthApi(config)
    this.bookmarks = new BookmarksApi(config)
    this.history = new HistoryApi(config)
    this.teams = new TeamsApi(config)
  }

  /**
   * 设置认证令牌
   * 会同时更新所有 API 模块的令牌
   */
  setToken(token: string) {
    this.auth.setToken(token)
    this.bookmarks.setToken(token)
    this.history.setToken(token)
    this.teams.setToken(token)
  }

  /**
   * 移除认证令牌
   * 会同时清除所有 API 模块的令牌
   */
  removeToken() {
    this.auth.removeToken()
    this.bookmarks.removeToken()
    this.history.removeToken()
    this.teams.removeToken()
  }

  /**
   * 检查是否已设置令牌
   */
  hasToken(): boolean {
    return !!(this.auth as any).config.token
  }
}

/**
 * 创建 Craz API 实例的工厂函数
 * 如果不提供配置，会自动使用环境变量
 */
export function createCrazApi(config: ApiClientConfig = {}): CrazApi {
  // 在开发环境下输出配置信息
  logApiConfig()

  return new CrazApi(config)
}

/**
 * 创建带有默认配置的 API 实例
 */
export function createCrazApiWithDefaults(
  baseUrl?: string,
  token?: string
): CrazApi {
  return createCrazApi({ baseUrl, token })
}

/**
 * 创建使用环境变量的 API 实例
 * 这是推荐的方式，会自动根据环境切换配置
 */
export function createCrazApiFromEnv(token?: string): CrazApi {
  const envConfig = getApiConfig()

  return createCrazApi({
    baseUrl: envConfig.baseUrl,
    token,
    timeout: envConfig.timeout,
    retryLimit: envConfig.retryLimit,
    enableLogs: envConfig.enableLogs
  })
}

// 默认导出主类
export default CrazApi
