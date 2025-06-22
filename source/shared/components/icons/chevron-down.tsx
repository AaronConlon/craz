import React from 'react'
import { cn } from '~/source/shared/utils'

interface ChevronDownProps {
  className?: string
  isOpen?: boolean
}

export const ChevronDown: React.FC<ChevronDownProps> = ({
  className,
  isOpen = false
}) => {
  return (
    <svg
      className={cn(
        "w-4 h-4 text-gray-400 transition-transform",
        isOpen && "rotate-180",
        className
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
} 