import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { cn } from '~source/shared/utils'
import type { OgData } from '~source/shared/utils/og-parser'

interface OgPreviewProps {
  ogData: OgData
  url: string
  className?: string
}

export function OgPreview({ ogData, url, className }: OgPreviewProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // 如果没有图片，不渲染组件
  if (!ogData.image || imageError) {
    return null
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleClick = () => {
    window.open(url, '_blank')
  }

  return (
    <div
      className={cn(
        // 基础样式
        "relative max-w-sm rounded-lg border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg",
        // 浅色模式渐变背景
        "bg-gradient-to-bl from-white to-gray-50 border-gray-200 hover:border-gray-300",
        // 深色模式渐变背景
        "dark:bg-gradient-to-bl dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 dark:hover:border-gray-600",
        // 动画效果
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        className
      )}
      onClick={handleClick}
    >
      {/* 图片区域 */}
      <div className="relative aspect-[1.91/1] overflow-hidden">
        {imageLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            // 浅色模式
            "bg-gray-100",
            // 深色模式
            "dark:bg-gray-800"
          )}>
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 animate-spin border-t-transparent" />
          </div>
        )}
        <img
          src={ogData.image}
          alt={ogData.title || '网站预览'}
          className={cn(
            "object-cover w-full h-full transition-opacity duration-300",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* 悬停遮罩 */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 flex items-center justify-center",
          // 浅色模式遮罩
          "bg-black/20",
          // 深色模式遮罩
          "dark:bg-black/40"
        )}>
          <ExternalLink size={24} className="text-white drop-shadow-lg" />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 网站名称 */}
        {ogData.siteName && (
          <div className={cn(
            "text-xs font-medium mb-1",
            // 浅色模式
            "text-theme-primary-600",
            // 深色模式
            "dark:text-theme-primary-400"
          )}>
            {ogData.siteName}
          </div>
        )}

        {/* 标题 */}
        {ogData.title && (
          <h3 className={cn(
            "text-sm font-semibold mb-2 line-clamp-2",
            // 浅色模式
            "text-gray-900",
            // 深色模式
            "dark:text-white"
          )}>
            {ogData.title}
          </h3>
        )}

        {/* 描述 */}
        {ogData.description && (
          <p className={cn(
            "text-xs line-clamp-3",
            // 浅色模式
            "text-gray-600",
            // 深色模式
            "dark:text-gray-400"
          )}>
            {ogData.description}
          </p>
        )}

        {/* URL 显示 */}
        <div className={cn(
          "text-xs mt-3 pt-2 border-t truncate",
          // 浅色模式
          "text-gray-500 border-gray-200",
          // 深色模式
          "dark:text-gray-500 dark:border-gray-700"
        )}>
          {new URL(url).hostname}
        </div>
      </div>
    </div>
  )
}