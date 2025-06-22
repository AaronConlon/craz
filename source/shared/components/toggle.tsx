import { forwardRef } from 'react'
import { cn } from '~/source/shared/utils'

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: 'sm' | 'default' | 'lg'
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, size = 'default', ...props }, ref) => {
    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'w-8 h-5 after:h-4 after:w-4'
        case 'lg':
          return 'w-14 h-7 after:h-6 after:w-6'
        default:
          return 'w-11 h-6 after:h-5 after:w-5'
      }
    }

    const toggle = (
      <label className="inline-flex relative items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all peer-checked:theme-bg-primary-600 theme-transition",
          getSizeClasses(),
          className
        )} />
      </label>
    )

    if (label || description) {
      return (
        <div className="flex justify-between items-center">
          <div>
            {label && <p className="text-sm text-gray-900 dark:text-white">{label}</p>}
            {description && <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>}
          </div>
          {toggle}
        </div>
      )
    }

    return toggle
  }
)

Toggle.displayName = 'Toggle'

export { Toggle } 