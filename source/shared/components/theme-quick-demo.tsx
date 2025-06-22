import { useState } from 'react'
import { Palette, Code, Settings, Zap } from 'lucide-react'

import { Button } from './button'
import { useTheme } from './theme-provider'

export function ThemeQuickDemo() {
  const { theme, fontSize, setTheme, setFontSize, setCustomColor } = useTheme()
  const [customColorInput, setCustomColorInput] = useState('')

  // 预设主题颜色
  const presetThemes = [
    { name: 'blue', color: '#3B82F6', label: '蓝色' },
    { name: 'purple', color: '#8B5CF6', label: '紫色' },
    { name: 'green', color: '#10B981', label: '绿色' },
    { name: 'orange', color: '#F59E0B', label: '橙色' },
    { name: 'pink', color: '#EC4899', label: '粉色' }
  ]

  // 字体大小选项
  const fontSizes = [
    { value: 'small', label: '小', class: 'text-sm' },
    { value: 'medium', label: '中', class: 'text-base' },
    { value: 'large', label: '大', class: 'text-lg' }
  ]

  // 快速主题切换
  const quickThemeSwitch = () => {
    const themes = ['blue', 'purple', 'green', 'orange', 'pink']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex] as any)
  }

  // 应用自定义颜色
  const applyCustomColor = () => {
    if (customColorInput && /^#[0-9A-Fa-f]{6}$/.test(customColorInput)) {
      setCustomColor(customColorInput)
    }
  }

  // 随机主题
  const randomTheme = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    setCustomColor(randomColor)
    setCustomColorInput(randomColor)
  }

  return (
    <div className="p-6 space-y-8 bg-white rounded-lg border shadow-lg">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-theme-text-primary">
          🎨 主题修改演示
        </h2>
        <p className="text-sm theme-primary">
          体验多种主题修改方式，实时查看效果!!
        </p>
      </div>

      {/* 当前状态显示 */}
      <div className="p-4 rounded-lg border bg-theme-bg-secondary border-theme-border-primary">
        <h3 className="flex gap-2 items-center mb-2 font-semibold text-theme-text-primary">
          <Settings size={16} />
          当前设置
        </h3>
        <div className="grid grid-cols-2 gap-4 text-theme-sm">
          <div>
            <span className="text-theme-text-secondary">主题:</span>
            <span className="ml-2 font-medium text-theme-text-primary">{theme}</span>
          </div>
          <div>
            <span className="text-theme-text-secondary">字体:</span>
            <span className="ml-2 font-medium text-theme-text-primary">{fontSize}</span>
          </div>
        </div>
      </div>

      {/* 方式1: 预设主题选择 */}
      <section className="space-y-3">
        <h3 className="flex gap-2 items-center font-semibold text-theme-text-primary">
          <Palette size={16} />
          方式1: 预设主题
        </h3>
        <div className="flex flex-wrap gap-2">
          {presetThemes.map((t) => (
            <button
              key={t.name}
              onClick={() => setTheme(t.name as any)}
              className={`
                px-3 py-2 rounded-lg border text-sm font-medium theme-transition
                flex items-center gap-2
                ${theme === t.name
                  ? 'border-theme-primary-500 bg-theme-primary-50 text-theme-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* 方式2: 自定义颜色 */}
      <section className="space-y-3">
        <h3 className="flex gap-2 items-center font-semibold text-theme-text-primary">
          <Code size={16} />
          方式2: 自定义颜色
        </h3>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-theme-text-secondary">#</span>
          <input
            type="text"
            placeholder="3B82F6"
            value={customColorInput.replace('#', '')}
            onChange={(e) => setCustomColorInput('#' + e.target.value.replace('#', ''))}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-theme-primary-500 theme-transition"
            maxLength={7}
          />
          <Button
            onClick={applyCustomColor}
            disabled={!customColorInput || !/^#[0-9A-Fa-f]{6}$/.test(customColorInput)}
            size="sm"
          >
            应用
          </Button>
          <Button
            onClick={randomTheme}
            variant="secondary"
            size="sm"
          >
            随机
          </Button>
        </div>
      </section>

      {/* 方式3: 字体大小 */}
      <section className="space-y-3">
        <h3 className="font-semibold text-theme-text-primary">字体大小</h3>
        <div className="flex gap-2">
          {fontSizes.map((fs) => (
            <button
              key={fs.value}
              onClick={() => setFontSize(fs.value as any)}
              className={`
                px-4 py-2 rounded-lg border text-sm font-medium theme-transition ${fs.class}
                ${fontSize === fs.value
                  ? 'border-theme-primary-500 bg-theme-primary-50 text-theme-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Aa {fs.label}
            </button>
          ))}
        </div>
      </section>

      {/* 方式4: 快速操作 */}
      <section className="space-y-3">
        <h3 className="flex gap-2 items-center font-semibold text-theme-text-primary">
          <Zap size={16} />
          快速操作
        </h3>
        <div className="flex gap-2">
          <Button onClick={quickThemeSwitch} variant="secondary">
            循环切换主题
          </Button>
          <Button
            onClick={() => {
              setTheme('blue')
              setFontSize('medium')
            }}
            variant="secondary"
          >
            重置为默认
          </Button>
        </div>
      </section>

      {/* 效果预览区 */}
      <section className="space-y-3">
        <h3 className="font-semibold text-theme-text-primary">效果预览</h3>
        <div className="p-4 space-y-3 rounded-lg border bg-theme-bg-primary border-theme-border-primary">
          <div className="flex gap-3 items-center">
            <Button size="sm">主色按钮</Button>
            <Button variant="secondary" size="sm">次要按钮</Button>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-theme-text-primary text-theme-base">
              这是主要文本，使用当前主题色
            </p>
            <p className="text-theme-text-secondary text-theme-sm">
              这是次要文本，字体大小会根据设置调整
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-theme-primary-50 border-theme-primary-200">
            <p className="text-theme-primary-700 text-theme-sm">
              这是一个主题色背景的提示框
            </p>
          </div>
        </div>
      </section>

      {/* 代码示例 */}
      <section className="space-y-3">
        <h3 className="font-semibold text-theme-text-primary">代码示例</h3>
        <div className="p-4 font-mono text-sm bg-gray-50 rounded-lg border">
          <div className="mb-2 text-gray-600">// 使用 useTheme Hook</div>
          <div className="text-blue-600">const</div>
          <div className="ml-2 text-gray-800">{'{ theme, setTheme } = useTheme()'}</div>
          <div className="mt-2 text-blue-600">setTheme</div>
          <div className="text-gray-800">('purple')</div>
        </div>
      </section>
    </div>
  )
} 