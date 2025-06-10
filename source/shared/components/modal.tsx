import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

/**
 * 优雅的模态框组件
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 transition-opacity duration-300 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div
        className={cn(
          "relative w-full mx-4 bg-white rounded-2xl shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-300",
          "border border-gray-200/50",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            {title && (
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * 模态框内容区域
 */
export function ModalContent({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-6 py-4", className)}>
      {children}
    </div>
  )
}

/**
 * 模态框按钮区域
 */
export function ModalActions({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50",
      className
    )}>
      {children}
    </div>
  )
} 