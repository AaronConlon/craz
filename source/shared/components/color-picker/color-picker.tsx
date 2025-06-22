import React from 'react'
import { cn } from '~/source/shared/utils'
import { getAvailableThemes } from '~/source/shared/utils/theme-utils'
import { applyThemeToDOM } from '~/source/shared/utils/dom-theme-utils'
import { CheckIcon } from '../icons/check'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
  disabled?: boolean
  label?: string
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className,
  disabled = false,
  label
}) => {
  const availableThemes = getAvailableThemes()

  // 处理主题颜色选择
  const handleThemeColorChange = (newColor: string) => {
    console.log('Theme color selected:', newColor)
    onChange(newColor)

    // 直接应用到DOM根元素
    applyThemeToDOM(newColor)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* 颜色圆形按钮网格 */}
      <div className="flex flex-wrap gap-3">
        {availableThemes.map(({ theme, color: themeColor, name }) => {
          const isSelected = color === themeColor

          return (
            <button
              key={theme}
              type="button"
              onClick={() => handleThemeColorChange(themeColor)}
              disabled={disabled}
              className={cn(
                "relative w-12 h-12 rounded-full border-2 transition-all duration-200",
                "hover:scale-110 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                isSelected
                  ? "border-gray-800 shadow-lg scale-110"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{ backgroundColor: themeColor }}
              title={name}
              aria-label={`选择${name}`}
            >
              {/* 选中状态指示器 */}
              {isSelected && (
                <div className="flex absolute inset-0 justify-center items-center">
                  <div className="flex justify-center items-center w-6 h-6 bg-white rounded-full shadow-sm">
                    <CheckIcon size="md" className="text-gray-800" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 当前选中的颜色信息 */}
      <div className="text-xs text-gray-500">
        当前主题: {availableThemes.find(({ color: themeColor }) => themeColor === color)?.name || '未知'} ({color})
      </div>
    </div>
  )
}
