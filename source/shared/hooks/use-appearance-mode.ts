import { useEffect, useState } from "react"

import type { AppearanceMode } from "../types/settings"
import {
  applyAppearanceMode,
  getActualDarkMode,
  getSavedAppearanceMode,
  getSystemDarkMode,
  watchSystemDarkMode
} from "../utils/appearance-utils"

/**
 * 界面模式管理钩子
 */
export function useAppearanceMode(
  defaultMode: AppearanceMode = "system",
  containerRef?: React.RefObject<HTMLElement>
) {
  const [currentMode, setCurrentMode] = useState<AppearanceMode>(defaultMode)
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)

  // 初始化界面模式
  useEffect(() => {
    const initializeMode = async () => {
      try {
        const savedMode = (await getSavedAppearanceMode()) || defaultMode
        setCurrentMode(savedMode)

        const actualDark = getActualDarkMode(savedMode)
        setIsDark(actualDark)

        applyAppearanceMode(savedMode, containerRef)
      } catch (error) {
        console.error("Failed to initialize appearance mode:", error)
        // 使用默认模式作为fallback
        setCurrentMode(defaultMode)
        const actualDark = getActualDarkMode(defaultMode)
        setIsDark(actualDark)
        applyAppearanceMode(defaultMode, containerRef)
      } finally {
        setLoading(false)
      }
    }

    initializeMode()
  }, [defaultMode, containerRef])

  // 监听系统深色模式变化
  useEffect(() => {
    if (currentMode === "system") {
      const unwatch = watchSystemDarkMode((systemIsDark) => {
        setIsDark(systemIsDark)
        applyAppearanceMode("system", containerRef)
      })

      return unwatch
    }
  }, [currentMode, containerRef])

  // 切换界面模式
  const setAppearanceMode = (mode: AppearanceMode) => {
    setCurrentMode(mode)

    const actualDark = getActualDarkMode(mode)
    setIsDark(actualDark)

    applyAppearanceMode(mode, containerRef)
  }

  // 切换深色模式
  const toggleDarkMode = () => {
    const newMode = isDark ? "light" : "dark"
    setAppearanceMode(newMode)
  }

  return {
    currentMode,
    isDark,
    isSystemDark: getSystemDarkMode(),
    loading,
    setAppearanceMode,
    toggleDarkMode
  }
}
