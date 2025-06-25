import type { PlasmoMessaging } from "@plasmohq/messaging"

import { DEFAULT_FAVICON_BASE64 } from "~source/shared/utils/default-favicon"
import {
  faviconDockItems,
  type AddDockItemRequest,
  type FaviconDockItem
} from "~source/shared/utils/favicon-dock-items"

export interface AddFaviconDockItemRequest {
  url: string
  title: string
  favicon?: string // 可选的 favicon，如果没有会尝试获取
  tabId?: number // 可选的标签页 ID，用于获取更多信息
}

export interface AddFaviconDockItemResponse {
  success: boolean
  item?: FaviconDockItem
  error?: string
}

/**
 * Background Message Handler: add-favicon-dock-item
 *
 * 功能：添加新的 favicon dock 项目
 * 架构说明：
 * - UI 通过此接口添加书签或标签页到 dock
 * - 自动获取 favicon（如果未提供）
 * - 保存到 IndexedDB 进行持久化存储
 * - 支持去重检查
 */
const handler: PlasmoMessaging.MessageHandler<
  AddFaviconDockItemRequest,
  AddFaviconDockItemResponse
> = async (req, res) => {
  console.log("[Background] 添加 favicon dock 项目请求:", req.body)

  try {
    const { url, title, favicon, tabId } = req.body

    if (!url || !title) {
      throw new Error("缺少必要参数: url 或 title")
    }

    // 验证 URL 格式
    let validUrl: string
    try {
      validUrl = new URL(url).toString()
    } catch {
      throw new Error("无效的 URL 格式")
    }

    // 准备 favicon
    let finalFavicon = favicon

    // 如果没有提供 favicon，尝试获取
    if (!finalFavicon) {
      console.log("[Background] 未提供 favicon，尝试获取...")

      // 如果提供了 tabId，尝试从标签页获取 favicon
      if (tabId) {
        try {
          const tab = await chrome.tabs.get(tabId)
          if (tab.favIconUrl && tab.favIconUrl.startsWith("http")) {
            finalFavicon = await fetchFaviconAsBase64(tab.favIconUrl)
          }
        } catch (error) {
          console.warn("[Background] 从标签页获取 favicon 失败:", error)
        }
      }

      // 如果仍然没有 favicon，尝试从网站获取
      if (!finalFavicon) {
        try {
          const domain = new URL(validUrl).hostname
          const faviconUrl = `https://${domain}/favicon.ico`
          finalFavicon = await fetchFaviconAsBase64(faviconUrl)
        } catch (error) {
          console.warn("[Background] 获取网站 favicon 失败:", error)
          // 使用默认 favicon
          finalFavicon = `data:image/png;base64,${DEFAULT_FAVICON_BASE64}`
        }
      }
    }

    // 确保 favicon 是 base64 格式
    if (finalFavicon && !finalFavicon.startsWith("data:image/")) {
      finalFavicon = `data:image/png;base64,${finalFavicon}`
    }

    // 添加到 IndexedDB
    const addRequest: AddDockItemRequest = {
      url: validUrl,
      title: title.trim(),
      favicon: finalFavicon
    }

    const newItem = await faviconDockItems.addItem(addRequest)

    console.log("[Background] Favicon dock 项目添加成功:", newItem)
    res.send({
      success: true,
      item: newItem
    })
  } catch (error) {
    console.error("[Background] 添加 favicon dock 项目失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "添加失败"
    })
  }
}

/**
 * 获取 favicon 并转换为 base64
 */
async function fetchFaviconAsBase64(faviconUrl: string): Promise<string> {
  try {
    const response = await fetch(faviconUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64String = btoa(String.fromCharCode(...uint8Array))

    // 获取 content type
    const contentType = response.headers.get("content-type") || "image/png"

    return `data:${contentType};base64,${base64String}`
  } catch (error) {
    console.error("[Background] 获取 favicon 失败:", faviconUrl, error)
    throw error
  }
}

export default handler
