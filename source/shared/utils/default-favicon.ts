/**
 * 默认 Favicon 工具
 */

/**
 * 默认的 favicon base64 字符串
 * 这是一个16x16像素的方形外链箭头图标
 */
// export const DEFAULT_FAVICON_BASE64 =
//   "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxM3Y2YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmg2Ii8+PHBhdGggZD0ibTIxIDMtOSA5Ii8+PHBhdGggZD0iTTE1IDNoNnY2Ii8+PC9zdmc+"

export const DEFAULT_FAVICON_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlLWljb24gbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYTE0LjUgMTQuNSAwIDAgMCAwIDIwIDE0LjUgMTQuNSAwIDAgMCAwLTIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4=`

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
