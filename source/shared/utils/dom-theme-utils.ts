// DOM主题应用工具函数

/**
 * 将HEX颜色转换为RGB
 */
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * 生成颜色变体（不同透明度）
 */
export const generateColorVariants = (baseColor: string) => {
  const rgb = hexToRgb(baseColor)
  if (!rgb) return {}

  const { r, g, b } = rgb

  return {
    50: `rgba(${r}, ${g}, ${b}, 0.05)`,
    100: `rgba(${r}, ${g}, ${b}, 0.1)`,
    200: `rgba(${r}, ${g}, ${b}, 0.2)`,
    300: `rgba(${r}, ${g}, ${b}, 0.3)`,
    400: `rgba(${r}, ${g}, ${b}, 0.4)`,
    500: baseColor, // 基础颜色
    600: `rgba(${r}, ${g}, ${b}, 0.6)`,
    700: `rgba(${r}, ${g}, ${b}, 0.7)`,
    800: `rgba(${r}, ${g}, ${b}, 0.8)`,
    900: `rgba(${r}, ${g}, ${b}, 0.9)`
  }
}

/**
 * 应用主题色到DOM
 */
export const applyThemeToDOM = (color: string) => {
  const root = document.documentElement
  const variants = generateColorVariants(color)

  // 设置CSS变量
  Object.entries(variants).forEach(([variant, value]) => {
    root.style.setProperty(`--theme-primary-${variant}`, value)
  })

  // 设置基础主题色
  root.style.setProperty("--theme-primary", color)

  console.log("Theme applied to DOM:", color, variants)
}

/**
 * 获取当前应用的主题色
 */
export const getCurrentThemeFromDOM = (): string => {
  const root = document.documentElement
  return getComputedStyle(root).getPropertyValue("--theme-primary").trim()
}

/**
 * 重置主题色到默认值
 */
export const resetThemeToDefault = () => {
  const defaultColor = "#FBBF24" // amber-400 - Tailwind CSS 标准色
  applyThemeToDOM(defaultColor)
}
