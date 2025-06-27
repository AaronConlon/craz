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

export interface ShareConfig {
  baseUrl: string
  twitterIntentUrl: string
}

export interface SocialMediaConfig {
  email: string
  twitterHandle: string
  twitterUrl: string
  wechatId: string
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
 * 获取分享配置
 */
export function getShareConfig(): ShareConfig {
  const baseUrl =
    process.env.PLASMO_PUBLIC_SHARE_BASE_URL || "https://craz.com/profile"
  const twitterIntentUrl = "https://x.com/intent/tweet"

  return {
    baseUrl,
    twitterIntentUrl
  }
}

/**
 * 获取社交媒体配置
 */
export function getSocialMediaConfig(): SocialMediaConfig {
  const email =
    process.env.PLASMO_PUBLIC_CONTACT_EMAIL || "rivenqinyy@gmail.com"
  const twitterHandle =
    process.env.PLASMO_PUBLIC_TWITTER_HANDLE || "AaronConlonDev"
  const twitterUrl = `https://x.com/${twitterHandle.replace("@", "")}`
  const wechatId = process.env.PLASMO_PUBLIC_WECHAT_ID || "Pls-recovery"

  return {
    email,
    twitterHandle,
    twitterUrl,
    wechatId
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
    apiConfig: getApiConfig(),
    shareConfig: getShareConfig(),
    socialMediaConfig: getSocialMediaConfig()
  }
}
