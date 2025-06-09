import { useEffect, useState } from "react"

import { cleanExpiredFaviconCache, getFaviconCache } from "../utils"

/**
 * 使用 favicon 缓存的 hook
 */
export function useFaviconCache(originalUrl?: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!originalUrl) {
      setCachedUrl(null)
      return
    }

    const loadCachedFavicon = async () => {
      setLoading(true)
      try {
        // 尝试从缓存获取
        const cached = await getFaviconCache(originalUrl)

        if (cached) {
          // 解析缓存格式："时间戳____base64"
          const [timestamp, base64] = cached.split("____")
          if (base64) {
            console.log("[FaviconCache] 使用缓存:", {
              url: originalUrl,
              timestamp: new Date(parseInt(timestamp))
            })
            setCachedUrl(base64)
          } else {
            setCachedUrl(null)
          }
        } else {
          setCachedUrl(null)
        }
      } catch (error) {
        console.error("[FaviconCache] 获取缓存失败:", error)
        setCachedUrl(null)
      } finally {
        setLoading(false)
      }
    }

    loadCachedFavicon()

    // 定期清理过期缓存
    cleanExpiredFaviconCache()
  }, [originalUrl])

  return {
    cachedUrl,
    loading,
    /** 最终使用的 URL（优先使用缓存，否则使用原始URL） */
    finalUrl: cachedUrl || originalUrl
  }
}
