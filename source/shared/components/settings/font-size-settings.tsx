import { Type } from 'lucide-react'
import type { FontSize } from '~source/shared/types/settings'
import { FONT_SIZES } from '~source/shared/types/settings'

interface FontSizeSettingsProps {
  currentFontSize: FontSize
  onFontSizeChange: (fontSize: FontSize) => void
}

export function FontSizeSettings({ currentFontSize, onFontSizeChange }: FontSizeSettingsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Type className="text-gray-700" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">字体大小</h3>
      </div>

      <div className="space-y-2">
        {Object.entries(FONT_SIZES).map(([size, config]) => (
          <button
            key={size}
            onClick={() => onFontSizeChange(size as FontSize)}
            className={`
              flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
              ${currentFontSize === size
              ? 'border-theme-primary-500 bg-theme-primary-50 text-theme-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="font-medium">{config.label}字体</span>
            <span
              className="text-gray-600"
              style={{ fontSize: config.value }}
            >
              示例文本 Sample Text
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        调整字体大小以获得更好的阅读体验
      </p>
    </div>
  )
}
