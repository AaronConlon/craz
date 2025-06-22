import React from 'react'
import { getThemeByColor } from '~/source/shared/utils/theme-utils'

interface ColorPreviewProps {
  color: string
  size?: 'sm' | 'md' | 'lg'
}

export const ColorPreview: React.FC<ColorPreviewProps> = ({
  color,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={`rounded-full border-2 border-gray-300 shadow-sm ${sizeClasses[size]}`}
      style={{ backgroundColor: color }}
    />
  )
}

interface ColorInfoProps {
  color: string
  showCode?: boolean
}

export const ColorInfo: React.FC<ColorInfoProps> = ({
  color,
  showCode = true
}) => {
  const themeInfo = getThemeByColor(color)

  return (
    <div className="text-left">
      <div className="text-sm font-medium text-gray-900">
        {themeInfo?.name || '自定义颜色'}
      </div>
      {showCode && (
        <div className="text-xs text-gray-500">{color}</div>
      )}
    </div>
  )
} 