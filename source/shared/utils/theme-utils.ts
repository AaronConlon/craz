import { THEME_COLORS } from "~/source/shared/types/settings";





// 主题名称映射 - Tailwind CSS 400级别
export const THEME_NAMES = {
  sky: "清新天蓝", // sky-500 - 清新天蓝色
  indigo: "明亮靛蓝", // indigo-400 - 科技感强
  emerald: "活力翠绿", // emerald-400 - 清新自然
  amber: "温暖金黄", // amber-400 - 醒目友好
  rose: "柔和玫瑰" // rose-400 - 优雅突出
} as const

// 主题描述信息 - 基于 Tailwind CSS 400 级别特性
export const THEME_DESCRIPTIONS = {
  sky: "清新的天蓝色调，明亮现代，传达活力与创新感",
  indigo: "明亮的科技靛蓝，现代感强，传达创新与信赖",
  emerald: "活力的清新翠绿，自然明快，象征成长与成功",
  amber: "温暖的醒目金黄，友好明亮，带来活力与创新",
  rose: "柔和的优雅玫瑰，温馨突出，用于强调与重要信息"
} as const

// 获取主题的显示名称
export const getThemeName = (theme: string): string => {
  return THEME_NAMES[theme as keyof typeof THEME_NAMES] || "未知主题"
}

// 获取主题的描述信息
export const getThemeDescription = (theme: string): string => {
  return (
    THEME_DESCRIPTIONS[theme as keyof typeof THEME_DESCRIPTIONS] || "暂无描述"
  )
}

// 根据颜色值获取对应的主题信息
export const getThemeByColor = (color: string) => {
  const entry = Object.entries(THEME_COLORS).find(
    ([theme, themeColor]) => theme !== "custom" && themeColor === color
  )
  return entry
    ? {
        theme: entry[0],
        name: getThemeName(entry[0]),
        description: getThemeDescription(entry[0])
      }
    : null
}

// 获取所有可用的主题选项
export const getAvailableThemes = () => {
  return Object.entries(THEME_COLORS)
    .filter(([theme]) => theme !== "custom")
    .map(([theme, color]) => ({
      theme,
      color,
      name: getThemeName(theme),
      description: getThemeDescription(theme)
    }))
}

// 获取主题色的对比度信息（用于可访问性检查）- Tailwind 400级别
export const getThemeAccessibility = (theme: string) => {
  const colorInfo = {
    zinc: {
      onWhite: "AAA",
      onBlack: "AAA",
      professional: true,
      brightness: "very-dark"
    },
    indigo: {
      onWhite: "AA+",
      onBlack: "AAA",
      professional: true,
      brightness: "bright"
    },
    emerald: {
      onWhite: "AA",
      onBlack: "AAA",
      professional: true,
      brightness: "bright"
    },
    amber: {
      onWhite: "AA",
      onBlack: "AAA",
      professional: true,
      brightness: "very-bright"
    },
    rose: {
      onWhite: "AA+",
      onBlack: "AAA",
      professional: true,
      brightness: "bright"
    }
  }

  return (
    colorInfo[theme as keyof typeof colorInfo] || {
      onWhite: "Unknown",
      onBlack: "Unknown",
      professional: false,
      brightness: "unknown"
    }
  )
}