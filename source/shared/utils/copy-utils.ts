/**
 * 复制工具函数
 *
 * 使用传统的 DOM 操作方式实现复制功能，兼容所有环境
 * 包括 content script、popup 等场景
 */

/**
 * 复制文本到剪贴板
 * 使用 textarea 元素和 document.execCommand 实现
 *
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    console.warn("[copyUtils] 没有内容可复制")
    return false
  }

  try {
    // 优先尝试现代 clipboard API（如果可用）
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      console.log("[copyUtils] 使用 Clipboard API 复制成功")
      return true
    }
  } catch (error) {
    console.warn("[copyUtils] Clipboard API 失败，回退到传统方法:", error)
  }

  // 回退到传统的 DOM 操作方法
  try {
    return copyToClipboardFallback(text)
  } catch (error) {
    console.error("[copyUtils] 复制失败:", error)
    return false
  }
}

/**
 * 传统的复制方法：使用 textarea + execCommand
 *
 * @param text 要复制的文本
 * @returns boolean 是否复制成功
 */
function copyToClipboardFallback(text: string): boolean {
  // 创建临时的 textarea 元素
  const textarea = document.createElement("textarea")

  // 设置样式，确保不影响页面布局
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  textarea.style.left = "-9999px"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  textarea.style.zIndex = "-1"

  // 设置要复制的文本
  textarea.value = text

  // 添加到 DOM
  document.body.appendChild(textarea)

  try {
    // 选中文本
    textarea.select()
    textarea.setSelectionRange(0, text.length)

    // 执行复制命令
    const success = document.execCommand("copy")

    if (success) {
      console.log("[copyUtils] 使用传统方法复制成功")
      return true
    } else {
      console.error("[copyUtils] execCommand 返回 false")
      return false
    }
  } catch (error) {
    console.error("[copyUtils] execCommand 执行失败:", error)
    return false
  } finally {
    // 清理：移除临时元素
    document.body.removeChild(textarea)
  }
}

/**
 * 复制 URL 地址
 *
 * @param url URL 地址
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyUrl(url: string): Promise<boolean> {
  if (!url) {
    console.warn("[copyUtils] URL 为空")
    return false
  }

  console.log("[copyUtils] 复制 URL:", url)
  return await copyToClipboard(url)
}

/**
 * 复制分享内容（标题 + URL）
 *
 * @param title 页面标题
 * @param url URL 地址
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyShare(title: string, url: string): Promise<boolean> {
  if (!title && !url) {
    console.warn("[copyUtils] 标题和 URL 都为空")
    return false
  }

  const shareText = title && url ? `${title}\n${url}` : title || url
  console.log(
    "[copyUtils] 复制分享内容:",
    shareText.substring(0, 100) + (shareText.length > 100 ? "..." : "")
  )

  return await copyToClipboard(shareText)
}

/**
 * 复制纯文本内容
 *
 * @param text 文本内容
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) {
    console.warn("[copyUtils] 文本内容为空")
    return false
  }

  console.log(
    "[copyUtils] 复制文本:",
    text.substring(0, 50) + (text.length > 50 ? "..." : "")
  )
  return await copyToClipboard(text)
}

/**
 * 检查是否支持复制功能
 *
 * @returns boolean 是否支持复制
 */
export function isCopySupported(): boolean {
  // 检查现代 clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    return true
  }

  // 检查传统 execCommand
  try {
    return document.queryCommandSupported("copy")
  } catch {
    return false
  }
}
