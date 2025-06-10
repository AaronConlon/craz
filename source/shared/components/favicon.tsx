import { useState, useEffect } from 'react'
import { sendToBackground } from '@plasmohq/messaging'
import { cn, isBase64Image } from '../utils'
import { DEFAULT_FAVICON_BASE64 } from '../utils/default-favicon'

interface FaviconProps {
  /** Favicon 图片 URL */
  src?: string
  /** 图标大小 */
  size?: number
  /** 自定义类名 */
  className?: string
  /** alt 文本 */
  alt?: string
  /** 背景色，默认为灰白色 */
  backgroundColor?: string
}

/**
 * Favicon 组件
 * 
 * 逻辑：
 * 1. 首先通过 background message 从 IndexedDB 缓存获取 favicon
 * 2. 如果没有缓存，使用 HEAD 请求检测资源可用性
 * 3. 资源可用则显示原始 URL 并异步获取缓存，否则显示默认图标
 */
export function Favicon({
  src,
  size = 16,
  className,
  alt = "",
  backgroundColor = "bg-gray-200"
}: FaviconProps) {
  const [finalUrl, setFinalUrl] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  // 获取 favicon（优先从缓存，没有则检测可用性并缓存）
  useEffect(() => {
    if (!src) {
      setFinalUrl(null)
      return
    }

    // 如果已经是 base64 格式，直接使用
    if (isBase64Image(src)) {
      setFinalUrl(src)
      return
    }

    // 如果是特殊 url，则使用默认 favicon
    if (src.includes('chrome://')) {
      setFinalUrl(DEFAULT_FAVICON_BASE64)
      return
    }

    const loadFavicon = async () => {
      setLoading(true)
      try {
        // 通过 background message 从 IndexedDB 获取缓存
        const cacheResponse = await sendToBackground({
          name: 'get-favicon-cache',
          body: { url: src }
        })

        if (cacheResponse.success && cacheResponse.cached) {
          console.log('[Favicon] 使用缓存 favicon:', src)
          setFinalUrl(cacheResponse.cached)
        } else {
          // 没有缓存，使用 HEAD 请求检测资源可用性
          console.log('[Favicon] 没有缓存，检测资源可用性:', src)

          const availabilityResponse = await sendToBackground({
            name: 'check-favicon-availability',
            body: {
              url: src,
              timeout: 3000 // 3秒超时
            }
          })

          if (availabilityResponse.success && availabilityResponse.available) {
            console.log('[Favicon] 资源可用，使用原始 URL:', {
              url: src,
              statusCode: availabilityResponse.statusCode,
              contentType: availabilityResponse.contentType,
              contentLength: availabilityResponse.contentLength
            })
            setFinalUrl(src)
            // 异步获取并缓存 favicon
            fetchAndCacheFavicon(src)
          } else {
            console.log('[Favicon] 资源不可用，使用默认图标:', {
              url: src,
              error: availabilityResponse.error
            })
            setFinalUrl(DEFAULT_FAVICON_BASE64)
          }
        }
      } catch (error) {
        console.error('[Favicon] 处理 favicon 失败:', error)
        setFinalUrl(DEFAULT_FAVICON_BASE64) // 出错时使用默认图标
      } finally {
        setLoading(false)
      }
    }

    loadFavicon()
  }, [src])

  // 通过 background 获取并缓存 favicon
  const fetchAndCacheFavicon = async (url: string) => {
    try {
      console.log('[Favicon] 开始获取并缓存 favicon:', url)

      const response = await sendToBackground({
        name: 'get-website-favicon',
        body: { url }
      })

      if (response.success && response.faviconBase64) {
        // 通过 background message 保存到 IndexedDB
        const saveResponse = await sendToBackground({
          name: 'save-favicon-cache',
          body: {
            url,
            base64: response.faviconBase64
          }
        })

        if (saveResponse.success) {
          // 更新显示的 URL
          setFinalUrl(response.faviconBase64)
          console.log('[Favicon] Favicon 获取并缓存成功:', url)
        }
      }
    } catch (error) {
      console.error('[Favicon] 获取 favicon 失败:', error)
    }
  }

  // 处理图片加载成功
  const handleLoad = () => {
    setShowImage(true)
    setImageLoaded(true)
  }

  // 处理图片加载错误
  const handleError = () => {
    setShowImage(false)
    setImageLoaded(true)
    // 如果原始 URL 加载失败，回退到默认图标
    if (finalUrl !== DEFAULT_FAVICON_BASE64) {
      console.log('[Favicon] 图片加载失败，回退到默认图标:', src)
      setFinalUrl(DEFAULT_FAVICON_BASE64)
    }
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-sm relative overflow-hidden",
        finalUrl && imageLoaded ? "bg-transparent" : backgroundColor,
        className
      )}
      style={{ width: size, height: size }}
      title={alt || "网站图标"}
    >
      {/* 图片层 */}
      {finalUrl && (
        <img
          src={finalUrl}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
            showImage ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* 加载指示器 */}
      {loading && !finalUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}

/**
 * 标签页 Favicon 组件，用于标签页场景
 */
export function TabFavicon({
  tab,
  size = 16,
  className,
  backgroundColor
}: {
  tab: { favIconUrl?: string; url?: string; title?: string }
  size?: number
  className?: string
  backgroundColor?: string
}) {
  return (
    <Favicon
      src={tab.favIconUrl}
      alt={tab.title}
      size={size}
      className={className}
      backgroundColor={backgroundColor}
    />
  )
} 