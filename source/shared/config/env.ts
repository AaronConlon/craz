/**
 * 环境变量配置
 * 使用 Plasmo 的环境变量能力
 */

export interface ApiConfig {
  baseUrl: string
  timeout: number
  retryLimit: number
  enableLogs: boolean
}

/**
 * 获取 API 配置
 * 开发环境使用 .env，生产环境使用 .env.prod
 */
export function getApiConfig(): ApiConfig {
  // Plasmo 会自动读取 PLASMO_PUBLIC_ 前缀的环境变量
  const baseUrl =
    process.env.PLASMO_PUBLIC_API_BASE_URL || "https://api.craz.com"
  const timeout = parseInt(process.env.PLASMO_PUBLIC_API_TIMEOUT || "30000", 10)
  const retryLimit = parseInt(
    process.env.PLASMO_PUBLIC_API_RETRY_LIMIT || "3",
    10
  )
  const enableLogs = process.env.PLASMO_PUBLIC_ENABLE_API_LOGS === "true"

  return {
    baseUrl,
    timeout,
    retryLimit,
    enableLogs
  }
}

/**
 * 环境检测
 */
export const isDevelopment = process.env.NODE_ENV === "development"
export const isProduction = process.env.NODE_ENV === "production"

/**
 * 调试工具
 */
export function logApiConfig() {
  if (isDevelopment) {
    const config = getApiConfig()
    console.log("🔧 API Configuration:", config)
    console.log("🌍 Environment:", process.env.NODE_ENV)
  }
}

/**
 * 获取完整的环境信息
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isDevelopment,
    isProduction,
    apiConfig: getApiConfig()
  }
}
