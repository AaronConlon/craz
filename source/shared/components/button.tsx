import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '~/source/shared/utils'

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  loading?: boolean
}

const getVariantClasses = (variant: ButtonVariant = 'default'): string => {
  switch (variant) {
    case 'default':
      return cn(
        // 背景色 - 使用主题色
        'bg-theme-primary-600 hover:bg-theme-primary-700 active:bg-theme-primary-800',
        'dark:bg-theme-primary-500 dark:hover:bg-theme-primary-600 dark:active:bg-theme-primary-700',
        // 文字色
        'text-white',
        // 焦点环
        'focus:ring-theme-primary-500 dark:focus:ring-theme-primary-400',
        // 渐变背景效果
        'bg-gradient-to-bl from-theme-primary-600 to-theme-primary-700',
        'dark:bg-gradient-to-bl dark:from-theme-primary-500 dark:to-theme-primary-600',
        'hover:from-theme-primary-700 hover:to-theme-primary-800',
        'dark:hover:from-theme-primary-600 dark:hover:to-theme-primary-700',
        // 过渡效果
        'transition-all duration-200'
      )
    case 'destructive':
      return cn(
        // 背景色
        'bg-red-600 hover:bg-red-700 active:bg-red-800',
        'dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700',
        // 文字色
        'text-white',
        // 焦点环
        'focus:ring-red-500 dark:focus:ring-red-400',
        // 渐变背景效果
        'bg-gradient-to-bl from-red-600 to-red-700',
        'dark:bg-gradient-to-bl dark:from-red-500 dark:to-red-600',
        'hover:from-red-700 hover:to-red-800',
        'dark:hover:from-red-600 dark:hover:to-red-700',
        // 过渡效果
        'transition-all duration-200'
      )
    case 'outline':
      return cn(
        // 边框
        'border border-gray-300 dark:border-gray-600',
        'hover:border-theme-primary-400 dark:hover:border-theme-primary-500',
        'focus:border-theme-primary-500 dark:focus:border-theme-primary-400',
        // 背景色
        'bg-white dark:bg-gray-800',
        'hover:bg-gradient-to-bl hover:from-theme-primary-50 hover:to-white',
        'dark:hover:bg-gradient-to-bl dark:hover:from-theme-primary-950 dark:hover:to-gray-800',
        // 文字色
        'text-gray-900 dark:text-gray-100',
        'hover:text-theme-primary-700 dark:hover:text-theme-primary-300',
        // 焦点环
        'focus:ring-theme-primary-500 dark:focus:ring-theme-primary-400',
        // 过渡效果
        'transition-all duration-200'
      )
    case 'secondary':
      return cn(
        // 背景色
        'bg-gray-100 dark:bg-gray-700',
        'hover:bg-gray-200 dark:hover:bg-gray-600',
        'active:bg-gray-300 dark:active:bg-gray-500',
        // 渐变背景效果
        'bg-gradient-to-bl from-gray-100 to-gray-200',
        'dark:bg-gradient-to-bl dark:from-gray-700 dark:to-gray-800',
        'hover:from-gray-200 hover:to-gray-300',
        'dark:hover:from-gray-600 dark:hover:to-gray-700',
        // 文字色
        'text-gray-900 dark:text-gray-100',
        // 焦点环
        'focus:ring-gray-500 dark:focus:ring-gray-400',
        // 过渡效果
        'transition-all duration-200'
      )
    case 'ghost':
      return cn(
        // 背景色 (透明，仅在 hover 时显示)
        'bg-transparent',
        'hover:bg-gradient-to-bl hover:from-gray-100 hover:to-gray-50',
        'dark:hover:bg-gradient-to-bl dark:hover:from-gray-800 dark:hover:to-gray-900',
        'active:bg-gray-200 dark:active:bg-gray-700',
        // 文字色
        'text-gray-700 dark:text-gray-300',
        'hover:text-gray-900 dark:hover:text-gray-100',
        // 焦点环
        'focus:ring-gray-500 dark:focus:ring-gray-400',
        // 过渡效果
        'transition-all duration-200'
      )
    case 'link':
      return cn(
        // 背景色 (透明)
        'bg-transparent',
        // 文字色 - 使用主题色
        'text-theme-primary-600 dark:text-theme-primary-400',
        'hover:text-theme-primary-700 dark:hover:text-theme-primary-300',
        'active:text-theme-primary-800 dark:active:text-theme-primary-500',
        // 下划线
        'underline-offset-4 hover:underline',
        // 焦点环
        'focus:ring-theme-primary-500 dark:focus:ring-theme-primary-400',
        // 过渡效果
        'transition-all duration-200'
      )
    default:
      return cn(
        // 默认使用 primary 样式
        'bg-theme-primary-600 hover:bg-theme-primary-700 active:bg-theme-primary-800',
        'dark:bg-theme-primary-500 dark:hover:bg-theme-primary-600 dark:active:bg-theme-primary-700',
        'text-white',
        'focus:ring-theme-primary-500 dark:focus:ring-theme-primary-400',
        'bg-gradient-to-bl from-theme-primary-600 to-theme-primary-700',
        'dark:bg-gradient-to-bl dark:from-theme-primary-500 dark:to-theme-primary-600',
        'hover:from-theme-primary-700 hover:to-theme-primary-800',
        'dark:hover:from-theme-primary-600 dark:hover:to-theme-primary-700',
        'transition-all duration-200'
      )
  }
}

const getSizeClasses = (size: ButtonSize = 'default'): string => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-xs'
    case 'default':
      return 'h-10 px-4 py-2 text-sm'
    case 'lg':
      return 'h-12 px-6 text-base'
    case 'icon':
      return 'h-10 w-10 p-0'
    default:
      return 'h-10 px-4 py-2 text-sm'
  }
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', icon, loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    // 确定要显示的图标
    const displayIcon = loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon

    return (
      <button
        className={cn(
          baseClasses,
          getVariantClasses(variant),
          getSizeClasses(size),
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {displayIcon && (
          <span className={cn(
            "flex items-center justify-center",
            children && "mr-3"
          )}>
            {displayIcon}
          </span>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button } 