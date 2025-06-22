// 主题色类型
export type ThemeColor =
  | "zinc"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "custom"

// 界面模式类型
export type AppearanceMode = "light" | "dark" | "system"

// 语言类型
export type Language = "zh-CN" | "en-US" | "ja-JP" | "ko-KR" | "fr-FR" | "de-DE"

// 字体大小类型
export type FontSize = "small" | "medium" | "large"

// 用户设置接口
export interface UserSettings {
  themeColor: ThemeColor // 主题色
  appearanceMode: AppearanceMode // 界面模式
  language: Language
  fontSize: FontSize
  createdAt: number
  updatedAt: number
}

// 向后兼容的类型别名
export type Theme = ThemeColor

// 扩展用户设置接口（包含用户级别的设置）
export interface ExtendedUserSettings extends UserSettings {
  receiveOfficialMessages?: boolean
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

// 语言选项
export const LANGUAGES: Record<Language, string> = {
  "zh-CN": "中文（简体）",
  "en-US": "English",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
  "fr-FR": "Français",
  "de-DE": "Deutsch"
}

// 字体大小配置
export const FONT_SIZES: Record<FontSize, { label: string; size: string }> = {
  small: { label: "小", size: "14px" },
  medium: { label: "中", size: "16px" },
  large: { label: "大", size: "18px" }
}

// 界面模式选项
export const APPEARANCE_MODES: Record<AppearanceMode, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统"
}

// Tailwind CSS 400级别主题色 - 适合黑白UI风格
export const THEME_COLORS: Record<ThemeColor, string> = {
  zinc: "#121826", // 精美暗黑，深蓝灰色调 (400级别基础色)
  indigo: "#818CF8", // indigo-400 - 明亮靛蓝，科技感强
  emerald: "#34D399", // emerald-400 - 活力翠绿，清新自然
  amber: "#FBBF24", // amber-400 - 温暖金黄，醒目友好
  rose: "#FB7185", // rose-400 - 柔和玫瑰，优雅突出
  custom: "#818CF8" // 默认值，实际由用户自定义
}

// 默认设置
export const DEFAULT_SETTINGS: UserSettings = {
  themeColor: "amber",
  appearanceMode: "system",
  language: "en-US",
  fontSize: "medium",
  createdAt: Date.now(),
  updatedAt: Date.now()
}

export function getDefaultSettings() {
  return DEFAULT_SETTINGS
}
