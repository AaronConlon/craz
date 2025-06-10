import { Palette } from 'lucide-react'
import type { Theme } from '~source/shared/types/settings'
import { THEME_COLORS } from '~source/shared/types/settings'

interface ThemeSettingsProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export function ThemeSettings({ currentTheme, onThemeChange }: ThemeSettingsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="text-gray-700" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">主题色彩</h3>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {Object.entries(THEME_COLORS).map(([theme, color]) => (
          <button
            key={theme}
            onClick={() => onThemeChange(theme as Theme)}
            className={`
              relative h-12 rounded-lg border-2 transition-all duration-200
              ${currentTheme === theme
                ? 'border-gray-800 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:scale-102'
              }
            `}
            style={{ backgroundColor: color as string }}
            title={getThemeLabel(theme as Theme)}
          >
            {currentTheme === theme && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        选择您喜欢的主题色彩，将应用于整个扩展界面
      </p>
    </div>
  )
}

function getThemeLabel(theme: Theme): string {
  const labels: Record<Theme, string> = {
    blue: '经典蓝',
    purple: '优雅紫',
    green: '自然绿',
    orange: '活力橙',
    pink: '温馨粉'
  }
  return labels[theme]
}
