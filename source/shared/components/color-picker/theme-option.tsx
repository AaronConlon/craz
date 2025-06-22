import React from 'react'
import { cn } from '~/source/shared/utils'
import { CheckIcon } from '../icons/check'

interface ThemeOptionProps {
  theme: string
  color: string
  name: string
  isSelected: boolean
  onClick: (color: string) => void
}

export const ThemeOption: React.FC<ThemeOptionProps> = ({
  theme,
  color,
  name,
  isSelected,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Theme button clicked:', theme, color)
    onClick(color)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex gap-3 items-center p-3 rounded-lg border-2 transition-all hover:bg-gray-50",
        isSelected
          ? "bg-blue-50 border-blue-500"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* 颜色预览 */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />

      {/* 主题信息 */}
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-gray-900">
          {name}
        </div>
        <div className="text-xs text-gray-500">{color}</div>
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <div className="flex flex-shrink-0 justify-center items-center w-5 h-5 bg-blue-500 rounded-full">
          <CheckIcon size="sm" />
        </div>
      )}
    </button>
  )
} 