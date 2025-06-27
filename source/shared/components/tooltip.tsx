import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../utils'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delay?: number
}

/**
 * Tooltip 悬停提示组件
 * 
 * 功能：
 * - 鼠标悬停显示提示内容
 * - 支持多种位置
 * - 使用主题色样式
 * - 支持延时显示
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-theme-primary-50 dark:border-t-theme-primary-950'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-theme-primary-50 dark:border-b-theme-primary-950'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-theme-primary-50 dark:border-l-theme-primary-950'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-theme-primary-50 dark:border-r-theme-primary-950'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-theme-primary-50 dark:border-t-theme-primary-950'
    }
  }

  return (
    <div
      className="inline-block relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div className={cn(
          'absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap',
          // 主题色样式
          'bg-theme-primary-50 text-theme-primary-700 border border-theme-primary-200',
          'dark:bg-theme-primary-950 dark:text-theme-primary-300 dark:border-theme-primary-800',
          // 位置
          getPositionClasses(),
          // 动画
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}>
          {content}

          {/* 箭头 */}
          <div className={cn(
            'absolute w-0 h-0 border-4 border-theme-primary-200 dark:border-theme-primary-800',
            getArrowClasses()
          )} />
        </div>
      )}
    </div>
  )
} 