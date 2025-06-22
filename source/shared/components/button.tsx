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
      return 'theme-bg-primary-600 dark:theme-bg-primary-500 text-white hover:theme-bg-primary-700 dark:hover:theme-bg-primary-600 focus:ring-blue-500 dark:focus:ring-blue-400 theme-transition'
    case 'destructive':
      return 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400'
    case 'outline':
      return 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:theme-border-primary-500 dark:focus:theme-border-primary-400 theme-transition'
    case 'secondary':
      return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
    case 'ghost':
      return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 dark:focus:ring-gray-400'
    case 'link':
      return 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline focus:ring-blue-500 dark:focus:ring-blue-400'
    default:
      return 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400'
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
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

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
            children && "mr-2"
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