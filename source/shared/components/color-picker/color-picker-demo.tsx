import React, { useState } from 'react'
import { ColorPicker } from './color-picker'
import { THEME_COLORS } from '~/source/shared/types/settings'
import { getThemeByColor } from '~/source/shared/utils/theme-utils'

export const ColorPickerDemo: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS.amber)
  const themeInfo = getThemeByColor(selectedColor)

  return (
    <div className="p-6 mx-auto max-w-lg bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Tailwind CSS 400级别主题色
      </h2>

      <ColorPicker
        color={selectedColor}
        onChange={setSelectedColor}
        label="选择主题色"
        className="mb-6"
      />

      {/* 当前主题信息 */}
      {themeInfo && (
        <div className="p-4 mb-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="mb-2 text-sm font-medium text-gray-900">
            当前主题：{themeInfo.name}
          </h3>
          <p className="mb-3 text-xs text-gray-600">
            {themeInfo.description}
          </p>
          <div className="flex gap-2 items-center">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
            <code className="px-2 py-1 font-mono text-xs bg-gray-100 rounded">
              {selectedColor}
            </code>
            <span className="text-xs text-gray-400">
              Tailwind 400级别
            </span>
          </div>
        </div>
      )}

      {/* 效果预览 */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg border-2 border-gray-200">
          <h3 className="mb-3 text-sm font-medium text-gray-700">效果预览</h3>

          {/* 白色背景示例 */}
          <div className="p-3 mb-4 bg-white rounded border">
            <div className="mb-2 text-xs text-gray-500">白色背景</div>
            <button
              className="px-4 py-2 font-medium text-white rounded"
              style={{ backgroundColor: selectedColor }}
            >
              主要按钮
            </button>
            <p className="mt-2 text-sm" style={{ color: selectedColor }}>
              这是使用主题色的文本链接
            </p>
          </div>

          {/* 黑色背景示例 */}
          <div className="p-3 bg-gray-900 rounded">
            <div className="mb-2 text-xs text-gray-400">黑色背景</div>
            <button
              className="px-4 py-2 font-medium text-gray-900 rounded"
              style={{ backgroundColor: selectedColor }}
            >
              主要按钮
            </button>
            <p className="mt-2 text-sm" style={{ color: selectedColor }}>
              这是使用主题色的文本链接
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          <p><strong>🎨 Tailwind CSS 400级别特点：</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• 符合 Tailwind 设计系统标准</li>
            <li>• 明亮度和饱和度平衡适中</li>
            <li>• 在黑白背景上都有良好对比度</li>
            <li>• 适合作为主色调和强调色使用</li>
            <li>• 与其他 Tailwind 颜色完美搭配</li>
          </ul>
          <p className="mt-2">
            使用 <code className="px-1 bg-gray-100 rounded">var(--theme-primary)</code> 在CSS中引用
          </p>
        </div>
      </div>
    </div>
  )
} 