import { useState } from 'react'
import { Button, Toggle, useTheme } from '~/source/shared/components'
import type { FontSize, Theme } from '~/source/shared/types/settings'
import { FONT_SIZES, THEME_COLORS } from '~/source/shared/types/settings'
import { cn } from '~/source/shared/utils'

export function ThemeDemo() {
  const { theme, fontSize, setTheme, setFontSize, setCustomColor } = useTheme()
  const [customColorInput, setCustomColorInput] = useState('#3B82F6')

  const handleCustomColorSubmit = () => {
    setCustomColor(customColorInput)
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="mb-2 font-bold text-theme-lg theme-primary theme-transition">
          主题系统演示
        </h1>
        <p className="text-gray-600 text-theme-base theme-transition">
          实时预览主题色和字体大小的变化效果
        </p>
      </div>

      {/* 当前主题信息 */}
      <div className="p-4 bg-white rounded-lg border theme-border-primary-500 theme-transition">
        <h2 className="mb-3 font-semibold text-theme-base theme-transition">当前主题设置</h2>
        <div className="grid grid-cols-2 gap-4 text-theme-sm theme-transition">
          <div>
            <span className="font-medium">主题色:</span>
            <span className="ml-2 theme-primary">{theme}</span>
          </div>
          <div>
            <span className="font-medium">字体大小:</span>
            <span className="ml-2">{fontSize}</span>
          </div>
        </div>
      </div>

      {/* 主题色选择 */}
      <div className="p-4 bg-white rounded-lg border theme-transition">
        <h3 className="mb-4 font-semibold text-theme-base theme-transition">主题色选择</h3>

        {/* 预设颜色 */}
        <div className="mb-4">
          <p className="mb-3 text-gray-600 text-theme-sm theme-transition">预设颜色:</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(THEME_COLORS).filter(([name]) => name !== 'custom').map(([themeName, color]) => (
              <button
                key={themeName}
                onClick={() => setTheme(themeName as Theme)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 theme-transition",
                  theme === themeName
                    ? "border-gray-400 ring-2 ring-blue-500 ring-offset-2"
                    : "border-gray-200 hover:border-gray-300"
                )}
                style={{ backgroundColor: color }}
                title={themeName}
              />
            ))}
          </div>
        </div>

        {/* 自定义颜色 */}
        <div>
          <p className="mb-3 text-gray-600 text-theme-sm theme-transition">自定义颜色:</p>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={customColorInput}
              onChange={(e) => setCustomColorInput(e.target.value)}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer theme-transition"
            />
            <input
              type="text"
              value={customColorInput}
              onChange={(e) => setCustomColorInput(e.target.value)}
              className="px-3 py-2 rounded border border-gray-300 text-theme-sm theme-transition focus:theme-border-primary-500"
              placeholder="#3B82F6"
            />
            <Button size="sm" onClick={handleCustomColorSubmit}>
              应用
            </Button>
          </div>
        </div>
      </div>

      {/* 字体大小选择 */}
      <div className="p-4 bg-white rounded-lg border theme-transition">
        <h3 className="mb-4 font-semibold text-theme-base theme-transition">字体大小选择</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(FONT_SIZES).map(([size, config]) => (
            <button
              key={size}
              onClick={() => setFontSize(size as FontSize)}
              className={cn(
                "p-4 border-2 rounded-lg transition-all theme-transition text-center",
                fontSize === size
                  ? "theme-border-primary-500 theme-bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="mb-2">
                <span
                  className="font-bold theme-primary theme-transition"
                  style={{ fontSize: config.value }}
                >
                  Aa
                </span>
              </div>
              <div className="font-medium text-theme-sm theme-transition">
                {config.label} ({config.value})
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 组件演示 */}
      <div className="p-4 bg-white rounded-lg border theme-transition">
        <h3 className="mb-4 font-semibold text-theme-base theme-transition">组件演示</h3>

        <div className="space-y-4">
          {/* 按钮演示 */}
          <div>
            <p className="mb-2 text-gray-600 text-theme-sm theme-transition">按钮组件:</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">主要按钮</Button>
              <Button variant="outline">边框按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
            </div>
          </div>

          {/* 开关演示 */}
          <div>
            <p className="mb-2 text-gray-600 text-theme-sm theme-transition">开关组件:</p>
            <div className="space-y-2">
              <Toggle
                label="启用通知"
                description="接收重要的系统通知"
                defaultChecked
              />
              <Toggle
                label="自动保存"
                description="自动保存您的工作进度"
              />
            </div>
          </div>

          {/* 文本演示 */}
          <div>
            <p className="mb-2 text-gray-600 text-theme-sm theme-transition">文本样式:</p>
            <div className="space-y-2">
              <h4 className="font-bold text-theme-lg theme-primary theme-transition">
                大标题文本 (Large)
              </h4>
              <p className="text-theme-base theme-transition">
                正文文本，这是默认的文本大小，适合大部分内容展示。(Base)
              </p>
              <p className="text-gray-600 text-theme-sm theme-transition">
                小号文本，通常用于辅助信息和说明文字。(Small)
              </p>
            </div>
          </div>

          {/* 卡片演示 */}
          <div>
            <p className="mb-2 text-gray-600 text-theme-sm theme-transition">卡片组件:</p>
            <div className="p-4 rounded-lg border theme-border-primary-500 theme-bg-primary-50 theme-transition">
              <h5 className="mb-2 font-semibold text-theme-base theme-primary theme-transition">
                主题色卡片
              </h5>
              <p className="text-theme-sm theme-transition">
                这个卡片使用了主题色作为边框和背景色，展示了主题系统的一致性。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS变量展示 */}
      <div className="p-4 bg-white rounded-lg border theme-transition">
        <h3 className="mb-4 font-semibold text-theme-base theme-transition">CSS变量值</h3>
        <div className="grid grid-cols-2 gap-4 font-mono text-theme-sm theme-transition">
          <div>
            <h4 className="mb-2 font-semibold">主题色变量:</h4>
            <div className="space-y-1 text-xs">
              <div>--theme-primary: <span className="theme-primary">当前值</span></div>
              <div>--theme-primary-50: <span style={{ color: 'var(--theme-primary-50)' }}>■</span></div>
              <div>--theme-primary-500: <span style={{ color: 'var(--theme-primary-500)' }}>■</span></div>
              <div>--theme-primary-900: <span style={{ color: 'var(--theme-primary-900)' }}>■</span></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">字体变量:</h4>
            <div className="space-y-1 text-xs">
              <div>--font-size-small: <span style={{ fontSize: 'var(--font-size-small)' }}>示例</span></div>
              <div>--font-size-medium: <span style={{ fontSize: 'var(--font-size-medium)' }}>示例</span></div>
              <div>--font-size-large: <span style={{ fontSize: 'var(--font-size-large)' }}>示例</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 