/**
 * 界面模式工具函数
 */

import type { AppearanceMode } from "../types/settings"

/**
 * 检测系统是否为深色模式
 */
export function getSystemDarkMode(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * 监听系统深色模式变化
 */
export function watchSystemDarkMode(
  callback: (isDark: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {}

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const handler = (e: MediaQueryListEvent) => callback(e.matches)

  mediaQuery.addEventListener("change", handler)

  // 返回取消监听的函数
  return () => mediaQuery.removeEventListener("change", handler)
}

/**
 * 根据界面模式获取实际的深色模式状态
 */
export function getActualDarkMode(appearanceMode: AppearanceMode): boolean {
  switch (appearanceMode) {
    case "dark":
      return true
    case "light":
      return false
    case "system":
      return getSystemDarkMode()
    default:
      return false
  }
}

/**
 * 应用界面模式到DOM（使用传入的容器ref）
 * @param appearanceMode - 界面模式
 * @param containerRef - 可选的容器ref，如果不提供则使用document.documentElement
 */
export function applyAppearanceMode(
  appearanceMode: AppearanceMode,
  containerRef?: React.RefObject<HTMLElement>
): void {
  const isDark = getActualDarkMode(appearanceMode)

  // 如果提供了容器ref，使用容器，否则使用document.documentElement
  const target =
    containerRef?.current ||
    (typeof document !== "undefined" ? document.documentElement : null)

  if (target) {
    // 设置data-appearance属性而不是class
    target.setAttribute("data-appearance", isDark ? "dark" : "light")
    target.setAttribute("data-appearance-mode", appearanceMode)
  }

  // 保存到 Chrome Storage 用于下次启动
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local
      .set({ "appearance-mode": appearanceMode })
      .catch((error) => {
        console.error("Failed to save appearance mode:", error)
      })
  }
}

/**
 * 从 Chrome Storage 获取保存的界面模式
 */
export async function getSavedAppearanceMode(): Promise<AppearanceMode | null> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get(["appearance-mode"])
      const saved = result["appearance-mode"]
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved as AppearanceMode
      }
    }
  } catch (error) {
    console.error("Failed to get saved appearance mode:", error)
  }

  return null
}

/**
 * 初始化界面模式
 */
export async function initializeAppearanceMode(
  defaultMode: AppearanceMode = "system",
  containerRef?: React.RefObject<HTMLElement>
): Promise<void> {
  const savedMode = (await getSavedAppearanceMode()) || defaultMode
  applyAppearanceMode(savedMode, containerRef)

  // 如果是系统模式，监听系统变化
  if (savedMode === "system") {
    watchSystemDarkMode(() => {
      applyAppearanceMode("system", containerRef)
    })
  }
}
