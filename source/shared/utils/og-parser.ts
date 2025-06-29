export interface OgData {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
  type?: string
}

/**
 * 从 HTML 内容中解析 Open Graph 元数据
 * @param html HTML 内容
 * @returns OG 数据对象
 */
export function parseOgData(html: string): OgData {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    const ogData: OgData = {}

    // 获取所有 meta 标签
    const metaTags = doc.querySelectorAll(
      'meta[property^="og:"], meta[name^="og:"]'
    )

    metaTags.forEach((meta) => {
      const property =
        meta.getAttribute("property") || meta.getAttribute("name")
      const content = meta.getAttribute("content")

      if (!property || !content) return

      switch (property) {
        case "og:title":
          ogData.title = content
          break
        case "og:description":
          ogData.description = content
          break
        case "og:image":
          ogData.image = content
          break
        case "og:url":
          ogData.url = content
          break
        case "og:site_name":
          ogData.siteName = content
          break
        case "og:type":
          ogData.type = content
          break
      }
    })

    // 如果没有 OG 标题，尝试获取页面标题
    if (!ogData.title) {
      const titleTag = doc.querySelector("title")
      if (titleTag) {
        ogData.title = titleTag.textContent?.trim()
      }
    }

    // 如果没有 OG 描述，尝试获取 meta description
    if (!ogData.description) {
      const metaDescription = doc.querySelector('meta[name="description"]')
      if (metaDescription) {
        ogData.description =
          metaDescription.getAttribute("content") || undefined
      }
    }

    // 验证图片 URL 是否为绝对路径，如果不是则转换为绝对路径
    if (ogData.image && ogData.url) {
      try {
        const baseUrl = new URL(ogData.url)
        const imageUrl = new URL(ogData.image, baseUrl.origin)
        ogData.image = imageUrl.href
      } catch (error) {
        // 如果转换失败，保持原始值
        console.warn("Failed to convert relative image URL to absolute:", error)
      }
    }

    return ogData
  } catch (error) {
    console.error("Failed to parse OG data:", error)
    return {}
  }
}

/**
 * 检查 OG 数据是否有效（至少包含图片）
 * @param ogData OG 数据对象
 * @returns 是否有效
 */
export function isValidOgData(ogData: OgData): boolean {
  return !!(ogData.image && ogData.image.trim().length > 0)
}
