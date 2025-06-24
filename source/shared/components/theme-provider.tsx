import { createContext, useContext, useEffect, type ReactNode } from 'react'

import { useUserProfile } from '~/source/shared/hooks/use-user-profile'
import { useCustomColor } from '~/source/shared/hooks/use-custom-color'
import type { AppearanceMode, FontSize, ThemeColor } from '~/source/shared/types/settings'
import { applyAppearanceMode } from '~/source/shared/utils/appearance-utils'
import { useContainerRef } from './container-provider'

// 主题上下文类型
interface ThemeContextType {
  themeColor: ThemeColor
  appearanceMode: AppearanceMode
  fontSize: FontSize
  customColor?: string
  setThemeColor: (themeColor: ThemeColor) => void
  setAppearanceMode: (appearanceMode: AppearanceMode) => void
  setFontSize: (fontSize: FontSize) => void
  setCustomColor: (color: string) => void
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 主题Provider组件Props
interface ThemeProviderProps {
  children: ReactNode
}

// 颜色工具函数 - 生成颜色色阶
function generateColorShades(baseColor: string) {
  // 这是一个简化的颜色生成函数
  // 在实际项目中，可以使用更复杂的颜色算法
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  return {
    50: `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`,
    100: `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
    200: `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`,
    300: `rgb(${Math.min(255, r + 10)}, ${Math.min(255, g + 10)}, ${Math.min(255, b + 10)})`,
    400: `rgb(${Math.min(255, r + 5)}, ${Math.min(255, g + 5)}, ${Math.min(255, b + 5)})`,
    500: baseColor,
    600: `rgb(${Math.max(0, r - 10)}, ${Math.max(0, g - 10)}, ${Math.max(0, b - 10)})`,
    700: `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`,
    800: `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
    900: `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`
  }
}

// 应用主题到DOM
function applyThemeToDOM(
  themeColor: ThemeColor,
  appearanceMode: AppearanceMode,
  fontSize: FontSize,
  {
    customColor,
    containerRef
  }: {
    customColor?: string
    containerRef: React.RefObject<HTMLDivElement>
  }
) {
  const root = containerRef.current
  if (!root) return

  // 设置主题色属性
  root.setAttribute('data-theme', themeColor)

  // 设置字体大小属性
  root.setAttribute('data-font-size', fontSize)

  // 应用界面模式
  applyAppearanceMode(appearanceMode, containerRef)

  // 如果是自定义主题色，设置CSS变量
  if (themeColor === 'custom' && customColor) {
    const shades = generateColorShades(customColor)

    root.style.setProperty('--custom-primary', customColor)
    root.style.setProperty('--custom-primary-50', shades[50])
    root.style.setProperty('--custom-primary-100', shades[100])
    root.style.setProperty('--custom-primary-200', shades[200])
    root.style.setProperty('--custom-primary-300', shades[300])
    root.style.setProperty('--custom-primary-400', shades[400])
    root.style.setProperty('--custom-primary-500', shades[500])
    root.style.setProperty('--custom-primary-600', shades[600])
    root.style.setProperty('--custom-primary-700', shades[700])
    root.style.setProperty('--custom-primary-800', shades[800])
    root.style.setProperty('--custom-primary-900', shades[900])
  }
}

// 主题Provider组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  const containerRef = useContainerRef()

  const { settings, updateSettings } = useUserProfile()
  const { customColor, saveColor, isLoading: customColorLoading } = useCustomColor()



  // 设置主题色
  const setThemeColor = async (themeColor: ThemeColor) => {
    updateSettings.mutate({ themeColor })
  }

  // 设置界面模式
  const setAppearanceMode = async (appearanceMode: AppearanceMode) => {
    updateSettings.mutate({ appearanceMode })
  }

  // 设置字体大小
  const setFontSize = async (fontSize: FontSize) => {
    updateSettings.mutate({ fontSize })
  }

  // 设置自定义颜色
  const setCustomColor = async (color: string) => {
    try {
      // 保存自定义颜色到Chrome Storage
      await saveColor(color)

      // 如果设置了自定义颜色，自动切换到custom主题
      updateSettings.mutate({ themeColor: 'custom' })

      // 立即应用自定义颜色
      applyThemeToDOM('custom', settings.appearanceMode, settings.fontSize, {
        customColor: color,
        containerRef
      })
    } catch (error) {
      console.error('Failed to set custom color:', error)
    }
  }

  // 当设置变化时应用主题
  useEffect(() => {
    if (settings) {
      applyThemeToDOM(settings.themeColor, settings.appearanceMode, settings.fontSize, {
        customColor: settings.themeColor === 'custom' ? customColor : undefined,
        containerRef
      })
    }
  }, [settings?.themeColor, settings?.appearanceMode, settings?.fontSize, customColor])

  // 初始化时应用默认主题
  useEffect(() => {
    if (settings && !customColorLoading) {
      applyThemeToDOM(settings.themeColor, settings.appearanceMode, settings.fontSize, {
        customColor: settings.themeColor === 'custom' ? customColor : undefined,
        containerRef
      })
    }
  }, [settings, customColor, customColorLoading])

  const contextValue: ThemeContextType = {
    themeColor: settings?.themeColor || 'amber',
    appearanceMode: settings?.appearanceMode || 'system',
    fontSize: settings?.fontSize || 'medium',
    customColor: customColor || undefined,
    setThemeColor,
    setAppearanceMode,
    setFontSize,
    setCustomColor
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// 使用主题的Hook
export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

// 主题工具函数
export const themeUtils = {
  // 获取当前主题色值
  getCurrentThemeColor: (shade: number = 500): string => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    return computedStyle.getPropertyValue(`--theme-primary-${shade}`).trim()
  },

  // 获取当前字体大小值
  getCurrentFontSize: (level: 'small' | 'medium' | 'large' = 'medium'): string => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    return computedStyle.getPropertyValue(`--font-size-${level}`).trim()
  },

  // 检查是否为深色主题
  isDarkTheme: (themeColor: ThemeColor): boolean => {
    // 这里可以根据需要扩展深色主题检测逻辑
    return false // 当前所有主题都是浅色
  },

  // 生成主题类名
  getThemeClasses: (baseClasses: string): string => {
    return `${baseClasses} theme-transition`
  }
} 