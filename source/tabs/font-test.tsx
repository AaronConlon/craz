import React from 'react'
import "~style.css"
import "data-text:~assets/fonts.css"

/**
 * 字体测试页面
 * 用于验证 Jost 字体是否正确加载和显示
 */
function FontTestPage() {
  const fontSizes = [
    { name: 'text-xs', class: 'text-xs', weight: 'font-normal' },
    { name: 'text-sm', class: 'text-sm', weight: 'font-normal' },
    { name: 'text-base', class: 'text-base', weight: 'font-normal' },
    { name: 'text-lg', class: 'text-lg', weight: 'font-normal' },
    { name: 'text-xl', class: 'text-xl', weight: 'font-normal' },
    { name: 'text-2xl', class: 'text-2xl', weight: 'font-normal' },
    { name: 'text-3xl', class: 'text-3xl', weight: 'font-normal' },
  ]

  const fontWeights = [
    { name: 'Normal (400)', class: 'font-normal' },
    { name: 'Medium (500)', class: 'font-medium' },
    { name: 'Semibold (600)', class: 'font-semibold' },
    { name: 'Bold (700)', class: 'font-bold' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white min-h-screen font-jost">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Jost 字体测试页面</h1>

      {/* 基本信息 */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">字体信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>字体名称:</strong> Jost
          </div>
          <div>
            <strong>字体源:</strong> assets/jost.ttf
          </div>
          <div>
            <strong>支持字重:</strong> 400, 500, 600, 700
          </div>
          <div>
            <strong>加载方式:</strong> data-base64 内联
          </div>
        </div>
      </div>

      {/* 字号测试 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">字号测试 (Font Sizes)</h2>
        <div className="space-y-4">
          {fontSizes.map((size) => (
            <div key={size.name} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-600 font-mono">
                {size.name}
              </div>
              <div className={`${size.class} ${size.weight} font-jost`}>
                The quick brown fox jumps over the lazy dog. 快速的棕色狐狸跳过懒狗。
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 字重测试 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">字重测试 (Font Weights)</h2>
        <div className="space-y-4">
          {fontWeights.map((weight) => (
            <div key={weight.name} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-600 font-mono">
                {weight.name}
              </div>
              <div className={`text-lg ${weight.class} font-jost`}>
                The quick brown fox jumps over the lazy dog. 快速的棕色狐狸跳过懒狗。
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 实际使用场景 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">实际使用场景</h2>

        {/* 标题和段落 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 font-jost">标题文本示例</h3>
          <p className="text-base text-gray-700 leading-relaxed font-jost">
            这是一段使用 Jost 字体的正文内容。Jost 是一个现代的几何无衬线字体，
            设计简洁优雅，非常适合用于用户界面和品牌设计。它具有良好的可读性和
            现代感，支持多种字重，可以满足不同的设计需求。
          </p>
        </div>

        {/* 按钮示例 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 font-jost">按钮示例</h3>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-theme-primary-600 text-white rounded-lg font-medium font-jost hover:bg-theme-primary-700 transition-colors">
              主要按钮
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-jost hover:bg-gray-50 transition-colors">
              次要按钮
            </button>
          </div>
        </div>

        {/* 表单示例 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 font-jost">表单示例</h3>
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-jost">
                用户名
              </label>
              <input
                type="text"
                placeholder="请输入用户名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-jost placeholder-gray-500 focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-jost">
                密码
              </label>
              <input
                type="password"
                placeholder="请输入密码"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-jost placeholder-gray-500 focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 字体加载检测 */}
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">字体加载检测</h3>
        <p className="text-sm text-gray-600">
          如果字体加载成功，您应该看到清晰、现代的 Jost 字体。如果字体未加载，
          浏览器将回退到 Inter 或系统默认字体。
        </p>
        <div className="mt-4 p-4 bg-white rounded border">
          <div style={{ fontFamily: 'Jost, Inter, system-ui, sans-serif' }} className="text-lg">
            ✓ 这行文字使用的是 Jost 字体 (如果加载成功)
          </div>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="text-lg mt-2">
            ✗ 这行文字使用的是回退字体 (Inter/system-ui)
          </div>
        </div>
      </div>
    </div>
  )
}

export default FontTestPage 