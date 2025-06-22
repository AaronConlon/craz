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
      return 'theme-bg-primary-600 text-white hover:theme-bg-primary-700 focus:ring-blue-500 theme-transition'
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    case 'outline':
      return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:theme-border-primary-500 theme-transition'
    case 'secondary':
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
    case 'ghost':
      return 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    case 'link':
      return 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500'
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
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