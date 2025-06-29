import { useQuery } from "@tanstack/react-query"

import { sendToBackground } from "@plasmohq/messaging"

import { getDefaultFaviconUrl, resolveUrl } from "../utils/url-utils"

interface Metadata {
  title?: string
  description?: string
  image?: string
  favicon?: string
  type?: string
  siteName?: string
  locale?: string
}

interface OGData extends Metadata {
  url: string
  cachedAt: string
}

interface FetchOGDataResponse {
  success: boolean
  data?: OGData
  error?: string
}

interface GetWebsiteHtmlResponse {
  success: boolean
  html?: string
  error?: string
}

/**
 * 从 HTML 中解析元数据
 */
function parseMetadataFromHtml(html: string, url: string): Metadata {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  const getMetaContent = (name: string): string | undefined => {
    const meta = doc.querySelector(
      `meta[property="og:${name}"], meta[name="og:${name}"], meta[name="${name}"]`
    )
    return meta?.getAttribute("content")
  }

  // 获取所有可能的 favicon
  const getFavicon = (): string | undefined => {
    // 按优先级查找 favicon
    const selectors = [
      "link[rel='icon']",
      "link[rel='shortcut icon']",
      "link[rel='apple-touch-icon']",
      "link[rel='apple-touch-icon-precomposed']",
      "link[rel*='icon']"
    ]

    for (const selector of selectors) {
      const link = doc.querySelector(selector)
      const href = link?.getAttribute("href")
      if (href) {
        return resolveUrl(url, href)
      }
    }

    // 如果没有找到，返回默认的 favicon 路径
    return getDefaultFaviconUrl(url)
  }

  const metadata: Metadata = {
    title: doc.title || getMetaContent("title"),
    description: getMetaContent("description"),
    image: resolveUrl(url, getMetaContent("image")),
    type: getMetaContent("type"),
    siteName: getMetaContent("site_name"),
    locale: getMetaContent("locale"),
    favicon: getFavicon()
  }

  // 清理空值
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  ) as Metadata
}

/**
 * 上传元数据到后端
 */
async function uploadMetadata(url: string, metadata: Metadata): Promise<void> {
  const API_ENDPOINT =
    process.env.PLASMO_PUBLIC_OG_API_ENDPOINT || "http://og-api.i5lin.top/api"
  const API_TOKEN =
    process.env.PLASMO_PUBLIC_OG_API_TOKEN || "your-secret-token"

  const response = await fetch(`${API_ENDPOINT}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({ url, metadata })
  })

  if (!response.ok) {
    throw new Error(`上传元数据失败: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "上传元数据失败")
  }
}

/**
 * 获取 URL 的 OG 数据
 */
export function useOGData(url: string | undefined) {
  return useQuery({
    queryKey: ["og-data", url],
    queryFn: async (): Promise<OGData | null> => {
      if (!url) {
        return null
      }

      try {
        // 首先尝试从 API 获取
        const response = await sendToBackground<
          { url: string },
          FetchOGDataResponse
        >({
          name: "fetch-og-data",
          body: { url }
        })

        if (response.success && response.data) {
          return response.data
        }

        // 如果 API 获取失败，尝试直接获取 HTML
        console.log("API 获取失败，尝试解析 HTML")
        const htmlResponse = await sendToBackground<
          { url: string },
          GetWebsiteHtmlResponse
        >({
          name: "get-website-html",
          body: { url }
        })

        if (!htmlResponse.success || !htmlResponse.html) {
          throw new Error(htmlResponse.error || "获取 HTML 失败")
        }

        // 解析 HTML 中的元数据
        const metadata = parseMetadataFromHtml(htmlResponse.html, url)

        // 上传元数据到后端
        await uploadMetadata(url, metadata)

        return {
          ...metadata,
          url,
          cachedAt: new Date().toISOString()
        }
      } catch (error) {
        console.error("获取 OG 数据失败:", error)
        throw error
      }
    },
    retry: 1
  })
}
