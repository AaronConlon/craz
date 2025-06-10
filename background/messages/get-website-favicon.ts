import type { PlasmoMessaging } from "@plasmohq/messaging"

import { DEFAULT_FAVICON_BASE64 } from "~source/shared/utils/default-favicon"
import { saveFaviconCache } from "~source/shared/utils/indexdb-utils"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.send({
        success: false,
        error: "URL is required"
      })
    }

    // 确保 URL 格式正确
    let targetUrl: string
    try {
      targetUrl = new URL(url).toString()
    } catch {
      return res.send({
        success: false,
        error: "Invalid URL format"
      })
    }

    console.log(`[get-website-favicon] Fetching favicon for: ${targetUrl}`)

    // 尝试获取网站的 favicon
    const faviconBase64 = await getFaviconFromWebsite(targetUrl)

    if (faviconBase64) {
      // 保存到 IndexDB
      await saveFaviconCache(targetUrl, faviconBase64)

      res.send({
        success: true,
        faviconBase64,
        message: "Favicon fetched and saved successfully"
      })
    } else {
      // 使用默认 favicon
      await saveFaviconCache(targetUrl, DEFAULT_FAVICON_BASE64)

      res.send({
        success: true,
        faviconBase64: DEFAULT_FAVICON_BASE64,
        message: "Used default favicon"
      })
    }
  } catch (error) {
    console.error("[get-website-favicon] Error:", error)
    res.send({
      success: false,
      error: error.message || "Failed to fetch favicon"
    })
  }
}

/**
 * 从网站获取 favicon
 */
async function getFaviconFromWebsite(url: string): Promise<string | null> {
  try {
    // 首先尝试请求网站的 HTML
    const htmlResponse = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    })

    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch HTML: ${htmlResponse.status}`)
    }

    const html = await htmlResponse.text()

    // 解析 HTML 获取 favicon URL
    const faviconUrl = extractFaviconFromHtml(html, url)

    if (!faviconUrl) {
      console.log(`[get-website-favicon] No favicon found in HTML for ${url}`)
      return null
    }

    console.log(`[get-website-favicon] Found favicon URL: ${faviconUrl}`)

    // 请求 favicon 并转换为 base64
    const faviconResponse = await fetch(faviconUrl)

    if (!faviconResponse.ok) {
      throw new Error(`Failed to fetch favicon: ${faviconResponse.status}`)
    }

    const faviconBlob = await faviconResponse.blob()
    const faviconBase64 = await blobToBase64(faviconBlob)

    return faviconBase64
  } catch (error) {
    console.error(
      `[get-website-favicon] Error fetching favicon for ${url}:`,
      error
    )
    return null
  }
}

/**
 * 从 HTML 中提取 favicon URL (使用正则表达式)
 */
function extractFaviconFromHtml(html: string, baseUrl: string): string | null {
  // 正则表达式匹配各种 favicon 链接，按优先级排序
  const faviconPatterns = [
    // 标准 icon (最高优先级)
    /<link[^>]*\s+rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<link[^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*\s+rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*>/i,

    // Apple touch icon
    /<link[^>]*\s+rel\s*=\s*["']apple-touch-icon(?:-precomposed)?["'][^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<link[^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*\s+rel\s*=\s*["']apple-touch-icon(?:-precomposed)?["'][^>]*>/i,

    // 更宽松的匹配 - 任何包含 icon 的 rel 属性
    /<link[^>]*\s+rel\s*=\s*["'][^"']*icon[^"']*["'][^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<link[^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*\s+rel\s*=\s*["'][^"']*icon[^"']*["'][^>]*>/i
  ]

  // 获取 HTML 的头部部分以提高匹配效率
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const searchHtml = headMatch ? headMatch[1] : html

  // 按优先级尝试匹配
  for (const pattern of faviconPatterns) {
    const match = searchHtml.match(pattern)
    if (match && match[1]) {
      const faviconUrl = match[1].trim()
      if (faviconUrl && !faviconUrl.startsWith("data:")) {
        console.log(
          `[get-website-favicon] Found favicon via regex: ${faviconUrl}`
        )
        return resolveUrl(faviconUrl, baseUrl)
      }
    }
  }

  // 尝试在整个 HTML 中搜索（以防 favicon 不在 head 中）
  if (headMatch) {
    for (const pattern of faviconPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        const faviconUrl = match[1].trim()
        if (faviconUrl && !faviconUrl.startsWith("data:")) {
          console.log(
            `[get-website-favicon] Found favicon in full HTML: ${faviconUrl}`
          )
          return resolveUrl(faviconUrl, baseUrl)
        }
      }
    }
  }

  console.log(`[get-website-favicon] No favicon found in HTML for ${baseUrl}`)

  // 如果没有找到，尝试默认的 /favicon.ico
  try {
    const url = new URL(baseUrl)
    const defaultFavicon = `${url.protocol}//${url.host}/favicon.ico`
    console.log(
      `[get-website-favicon] Using default favicon: ${defaultFavicon}`
    )
    return defaultFavicon
  } catch {
    return null
  }
}

/**
 * 解析相对 URL 为绝对 URL
 */
function resolveUrl(faviconUrl: string, baseUrl: string): string {
  try {
    // 如果已经是绝对 URL，直接返回
    if (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://")) {
      return faviconUrl
    }

    // 使用 URL 构造器解析相对 URL
    const url = new URL(faviconUrl, baseUrl)
    return url.toString()
  } catch {
    return faviconUrl
  }
}

/**
 * 将 Blob 转换为 base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前缀，只保留 base64 部分
      const base64 = result.split(",")[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default handler
