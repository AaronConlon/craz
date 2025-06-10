// 主题类型
export type Theme = "blue" | "purple" | "green" | "orange" | "pink"

// 语言类型
export type Language = "zh-CN" | "zh-TW" | "en" | "ja" | "ko" | "ru"

// 字体大小类型
export type FontSize = "small" | "medium" | "large"

// 用户设置接口
export interface UserSettings {
  theme: Theme
  language: Language
  fontSize: FontSize
  createdAt: number
  updatedAt: number
}

// 登录状态接口
export interface AuthStatus {
  isLoggedIn: boolean
  userId?: string
  username?: string
  token?: string
  expiresAt?: number
}

// 设置响应接口
export interface SettingsResponse {
  settings: UserSettings
  authStatus: AuthStatus
  isDefault: boolean // 是否为默认设置
}

// 主题配置
export const THEME_COLORS: Record<Theme, string> = {
  blue: "#3B82F6",
  purple: "#8B5CF6",
  green: "#10B981",
  orange: "#F59E0B",
  pink: "#EC4899"
}

// 语言配置
export const LANGUAGES: Record<Language, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁体中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский"
}

// 字体大小配置
export const FONT_SIZES: Record<FontSize, { label: string; value: string }> = {
  small: { label: "小", value: "0.875rem" },
  medium: { label: "中", value: "1rem" },
  large: { label: "大", value: "1.125rem" }
}

// 默认设置生成函数
export const getDefaultSettings = (): UserSettings => {
  // 检测浏览器语言
  const detectBrowserLanguage = (): Language => {
    const browserLang = navigator.language || navigator.languages?.[0] || "en"

    if (browserLang.startsWith("zh")) {
      return browserLang.includes("TW") || browserLang.includes("HK")
        ? "zh-TW"
        : "zh-CN"
    }

    const langMap: Record<string, Language> = {
      ja: "ja",
      ko: "ko",
      ru: "ru"
    }

    return langMap[browserLang.split("-")[0]] || "en"
  }

  return {
    theme: "blue",
    language: detectBrowserLanguage(),
    fontSize: "medium",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}
