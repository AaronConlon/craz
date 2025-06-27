import { useState, useEffect } from 'react'
import { cn, isBase64Image } from '../utils'
import { DEFAULT_FAVICON_BASE64 } from '../utils/default-favicon'
import { Globe } from 'lucide-react'

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
 * 从 URL 中提取域名
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * 生成 twenty-icons.com 的图标 URL
 * 参考：https://twenty-icons.com/airbnb.com
 */
function generateTwentyIconsUrl(domain: string): string {
  // 移除 www. 前缀以获得更好的匹配
  const cleanDomain = domain.replace(/^www\./, '')
  return `https://twenty-icons.com/${cleanDomain}`
}

/**
 * Favicon 组件 - 多级回退策略
 * 
 * 回退策略：
 * 1. 🎨 始终先渲染 gray-50 背景色，图片透明度为 0
 * 2. 🔗 尝试加载原始 favicon URL
 * 3. 🌐 如果失败，提取域名并尝试 twenty-icons.com 服务
 * 4. 🛡️ 如果还是失败，使用默认的 SVG 图标
 * 5. ✨ 只有在图片完全加载后才显示（opacity: 1）
 * 
 * 特殊处理：
 * - Base64 图片直接使用
 * - Chrome 内部页面直接使用默认图标
 * - 无效 URL 自动回退
 */
export function Favicon({
  src,
  size = 24,
  className,
  alt = "",
  backgroundColor = "bg-theme-primary-100"
}: FaviconProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loadingState, setLoadingState] = useState<'idle' | 'original' | 'twenty-icons' | 'fallback'>('idle')

  // 初始化 favicon URL
  useEffect(() => {
    if (!src) {
      setCurrentUrl(null)
      setLoadingState('idle')
      return
    }

    // 如果已经是 base64 格式，直接使用
    if (isBase64Image(src)) {
      setCurrentUrl(src)
      setLoadingState('idle')
      return
    }

    // 如果是特殊 url，则使用默认 favicon
    if (src.includes('chrome://')) {
      setCurrentUrl(DEFAULT_FAVICON_BASE64)
      setLoadingState('fallback')
      return
    }

    // 开始尝试加载原始 URL
    setCurrentUrl(src)
    setLoadingState('original')
    setImageLoaded(false)
  }, [src])

  // 处理图片加载成功
  const handleLoad = () => {
    setImageLoaded(true)
    console.log('[Favicon] 图片加载成功:', currentUrl, 'State:', loadingState)
  }

  // 处理图片加载错误 - 实现多级回退策略
  const handleError = () => {
    console.log('[Favicon] 图片加载失败:', {
      url: currentUrl,
      state: loadingState,
      originalSrc: src
    })

    if (loadingState === 'original' && src) {
      // 第一次失败：尝试 twenty-icons.com 服务
      const domain = extractDomain(src)
      if (domain) {
        const twentyIconsUrl = generateTwentyIconsUrl(domain)
        console.log('[Favicon] 🔄 回退到 twenty-icons.com 服务:', {
          domain,
          twentyIconsUrl
        })
        setCurrentUrl(twentyIconsUrl)
        setLoadingState('twenty-icons')
        setImageLoaded(false)
        return
      }
    }

    if (loadingState === 'twenty-icons') {
      // 第二次失败：使用默认 SVG 图标
      console.log('[Favicon] 🔄 回退到默认图标')
      setCurrentUrl(DEFAULT_FAVICON_BASE64)
      setLoadingState('fallback')
      setImageLoaded(false)
      return
    }

    // 最终回退已经是默认图标，标记为已加载
    console.log('[Favicon] ✅ 最终回退完成')
    setImageLoaded(true)
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-sm relative overflow-hidden",
        // 始终保持 gray-50 背景色，只有在图片完全加载后才变透明
        imageLoaded && currentUrl ? "bg-transparent" : backgroundColor,
        className
      )}
      style={{ width: size, height: size }}
      title={alt || "网站图标"}
    >
      {/* 图片层 */}
      {currentUrl && (
        <img
          src={currentUrl}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
            // 图片在 onLoad 之前透明度为 0
            imageLoaded ? "animate-jump-in" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* 加载指示器 - 当正在加载且图片还未加载时显示 */}
      {loadingState !== 'idle' && !imageLoaded && (
        <div className="flex absolute inset-0 justify-center items-center">
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
  size = 24,
  className,
  backgroundColor,
}: {
    tab: { favIconUrl?: string; url?: string; title?: string, favicon?: string }
  size?: number
  className?: string
  backgroundColor?: string
}) {

  if (!tab.favicon?.startsWith('http')) {
    return (
      <Globe size={size} className={cn("text-theme-primary-400", className)} />
    )
  }

  return (
    <Favicon
      src={tab.favicon || tab.favIconUrl}
      alt={tab.title}
      size={size}
      className={className}
      backgroundColor={backgroundColor}
    />
  )
} 