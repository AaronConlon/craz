import { useState, useEffect } from 'react'
import { sendToBackground } from '@plasmohq/messaging'
import { cn, isBase64Image, saveFaviconCache } from '../utils'
import { useFaviconCache } from '../hooks'

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
 * 简洁的 Favicon 组件
 * 
 * 逻辑：
 * 1. 始终显示背景色
 * 2. 如果有 src 且加载成功，显示图片覆盖背景
 * 3. 如果没有 src 或加载失败，只显示背景色
 */
export function Favicon({
  src,
  size = 16,
  className,
  alt = "",
  backgroundColor = "bg-gray-200"
}: FaviconProps) {
  const [showImage, setShowImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 使用favicon缓存
  const { finalUrl } = useFaviconCache(src)

  // 处理favicon缓存
  useEffect(() => {
    if (src && !isBase64Image(src)) {
      // 如果不是base64格式，发送给background保存
      saveFaviconToCache(src)
    }
  }, [src])

  // 保存favicon到缓存
  const saveFaviconToCache = async (url: string) => {
    try {
      console.log('[Favicon] 开始缓存 favicon:', url)

      const response = await sendToBackground({
        name: 'save-favicon',
        body: { url }
      })

      if (response.success) {
        const logMessage = response.isDefault
          ? '[Favicon] 使用默认 favicon:'
          : '[Favicon] Favicon 缓存成功:'

        console.log(logMessage, {
          url: response.url,
          size: response.size,
          isDefault: response.isDefault
        })

        // 保存到 IndexedDB
        await saveFaviconCache(url, response.base64)
      } else {
        console.warn('[Favicon] Favicon 缓存失败:', response.error)
      }
    } catch (error) {
      console.error('[Favicon] Favicon 缓存错误:', error)
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
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-sm relative overflow-hidden",
        imageLoaded ? "bg-transparent" : backgroundColor,
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