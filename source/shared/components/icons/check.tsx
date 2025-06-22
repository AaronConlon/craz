import React from 'react'
import { cn } from '~/source/shared/utils'

interface CheckIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const CheckIcon: React.FC<CheckIconProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <svg
      className={cn(sizeClasses[size], 'text-white', className)}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
} 