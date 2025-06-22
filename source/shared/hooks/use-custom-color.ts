import { useEffect, useState } from "react"

import {
  getCustomColor,
  onCustomColorChange,
  removeCustomColor,
  saveCustomColor
} from "../utils/chrome-storage-utils"

/**
 * 自定义颜色管理 Hook
 * 处理自定义颜色的读取、保存和同步
 */
export function useCustomColor() {
  const [customColor, setCustomColor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始化时加载自定义颜色
  useEffect(() => {
    const loadCustomColor = async () => {
      try {
        setIsLoading(true)
        const color = await getCustomColor()
        setCustomColor(color)
        setError(null)
      } catch (err) {
        console.error("Failed to load custom color:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load custom color"
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomColor()
  }, [])

  // 监听自定义颜色变化
  useEffect(() => {
    const unsubscribe = onCustomColorChange((color) => {
      setCustomColor(color)
    })

    return unsubscribe
  }, [])

  // 保存自定义颜色
  const saveColor = async (color: string) => {
    try {
      await saveCustomColor(color)
      setCustomColor(color)
      setError(null)
    } catch (err) {
      console.error("Failed to save custom color:", err)
      setError(
        err instanceof Error ? err.message : "Failed to save custom color"
      )
      throw err
    }
  }

  // 删除自定义颜色
  const removeColor = async () => {
    try {
      await removeCustomColor()
      setCustomColor(null)
      setError(null)
    } catch (err) {
      console.error("Failed to remove custom color:", err)
      setError(
        err instanceof Error ? err.message : "Failed to remove custom color"
      )
      throw err
    }
  }

  return {
    customColor,
    isLoading,
    error,
    saveColor,
    removeColor,
    hasCustomColor: customColor !== null
  }
}
