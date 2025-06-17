import { PackageOpen } from 'lucide-react'
import { cn } from '../utils'

interface EmptyStateProps {
  /** 主标题文本 */
  title?: string
  /** 描述文本 */
  description?: string
  /** 图标大小 */
  iconSize?: number
  /** 图标颜色类名 */
  iconColor?: string
  /** 标题样式类名 */
  titleClassName?: string
  /** 描述样式类名 */
  descriptionClassName?: string
  /** 容器样式类名 */
  className?: string
  /** 自定义操作区域 */
  action?: React.ReactNode
  /** 点击事件 */
  onClick?: () => void
}

/**
 * 通用空状态组件
 * 特性：
 * - 使用 PackageOpen 图标
 * - 支持自定义标题和描述
 * - 灵活的样式控制
 * - 可选的操作区域
 * - 支持点击事件
 */
export function EmptyState({
  title = '暂无数据',
  description,
  iconSize = 48,
  iconColor = 'text-gray-400',
  titleClassName,
  descriptionClassName,
  className,
  action,
  onClick
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        onClick && 'transition-colors',
        className
      )}
      onClick={onClick}
    >
      {/* 图标 */}
      <div className="mb-4">
        <PackageOpen
          size={iconSize}
          className={cn('transition-colors', iconColor)}
        />
      </div>

      {/* 标题 */}
      <h3 className={cn(
        'text-lg font-medium text-gray-900 mb-2',
        titleClassName
      )}>
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className={cn(
          'text-sm text-gray-600 max-w-sm',
          descriptionClassName
        )}>
          {description}
        </p>
      )}

      {/* 操作区域 */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

// 预设的空状态变体
export const EmptyStateVariants = {
  /** 搜索无结果 */
  noSearchResults: {
    title: '没有找到匹配的结果',
    description: '尝试调整搜索条件或使用其他关键词',
    iconColor: 'text-blue-400'
  },

  /** 无数据 */
  noData: {
    title: '暂无数据',
    description: '当前还没有任何内容',
    iconColor: 'text-gray-400'
  },

  /** 无收藏 */
  noBookmarks: {
    title: '还没有收藏',
    description: '收藏喜欢的内容，方便随时查看',
    iconColor: 'text-yellow-400'
  },

  /** 无标签页 */
  noTabs: {
    title: '没有打开的标签页',
    description: '当前浏览器中没有打开任何标签页',
    iconColor: 'text-green-400'
  },

  /** 加载失败 */
  loadError: {
    title: '加载失败',
    description: '无法获取数据，请稍后重试',
    iconColor: 'text-red-400'
  }
}
