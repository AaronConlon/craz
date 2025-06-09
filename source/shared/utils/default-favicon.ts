/**
 * 默认 Favicon 工具
 */

/**
 * 默认的 favicon base64 字符串
 * 这是一个16x16像素的简单网页图标（灰色圆形）
 */
export const DEFAULT_FAVICON_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzk0QTNBRiIvPgo8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNCIgZmlsbD0iIzY4NzI4MCIvPgo8L3N2Zz4K"

/**
 * 获取默认 favicon 的缓存对象
 * @param originalUrl 原始请求的 URL
 * @returns favicon 缓存对象
 */
export function getDefaultFaviconCache(originalUrl: string) {
  const timestamp = Date.now()
  const cacheKey = `${timestamp}____${DEFAULT_FAVICON_BASE64}`

  return {
    url: originalUrl,
    timestamp,
    base64: DEFAULT_FAVICON_BASE64,
    cacheKey,
    isDefault: true // 标记为默认图标
  }
}

/**
 * 检查是否为默认 favicon
 * @param base64 base64 字符串
 * @returns 是否为默认图标
 */
export function isDefaultFavicon(base64: string): boolean {
  return base64 === DEFAULT_FAVICON_BASE64
}
