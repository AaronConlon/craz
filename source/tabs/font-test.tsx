import React from 'react'
import "~style.css"
import "data-text:~contents/fonts.css"

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
    <div className="p-8 mx-auto max-w-6xl min-h-screen bg-white font-jost">
      <h1 className="mb-8 text-4xl font-bold text-gray-800">Jost 字体测试页面</h1>

      {/* 基本信息 */}
      <div className="p-6 mb-8 bg-gray-50 rounded-lg">
        <h2 className="mb-4 text-2xl font-semibold">字体信息</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
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
        <h2 className="mb-4 text-2xl font-semibold">字号测试 (Font Sizes)</h2>
        <div className="space-y-4">
          {fontSizes.map((size) => (
            <div key={size.name} className="flex gap-4 items-center">
              <div className="w-20 font-mono text-sm text-gray-600">
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
        <h2 className="mb-4 text-2xl font-semibold">字重测试 (Font Weights)</h2>
        <div className="space-y-4">
          {fontWeights.map((weight) => (
            <div key={weight.name} className="flex gap-4 items-center">
              <div className="w-32 font-mono text-sm text-gray-600">
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
        <h2 className="mb-4 text-2xl font-semibold">实际使用场景</h2>

        {/* 标题和段落 */}
        <div className="mb-6">
          <h3 className="mb-2 text-xl font-semibold font-jost">标题文本示例</h3>
          <p className="text-base leading-relaxed text-gray-700 font-jost">
            这是一段使用 Jost 字体的正文内容。Jost 是一个现代的几何无衬线字体，
            设计简洁优雅，非常适合用于用户界面和品牌设计。它具有良好的可读性和
            现代感，支持多种字重，可以满足不同的设计需求。
          </p>
        </div>

        {/* 按钮示例 */}
        <div className="mb-6">
          <h3 className="mb-2 text-xl font-semibold font-jost">按钮示例</h3>
          <div className="flex gap-4">
            <button className="px-4 py-2 font-medium text-white rounded-lg transition-colors bg-theme-primary-600 font-jost hover:bg-theme-primary-700">
              主要按钮
            </button>
            <button className="px-4 py-2 font-medium text-gray-700 rounded-lg border border-gray-300 transition-colors font-jost hover:bg-gray-50">
              次要按钮
            </button>
          </div>
        </div>

        {/* 表单示例 */}
        <div className="mb-6">
          <h3 className="mb-2 text-xl font-semibold font-jost">表单示例</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 font-jost">
                用户名
              </label>
              <input
                type="text"
                placeholder="请输入用户名"
                className="px-3 py-2 w-full placeholder-gray-500 rounded-lg border border-gray-300 font-jost focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 font-jost">
                密码
              </label>
              <input
                type="password"
                placeholder="请输入密码"
                className="px-3 py-2 w-full placeholder-gray-500 rounded-lg border border-gray-300 font-jost focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 字体加载检测 */}
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="mb-2 text-xl font-semibold">字体加载检测</h3>
        <p className="text-sm text-gray-600">
          如果字体加载成功，您应该看到清晰、现代的 Jost 字体。如果字体未加载，
          浏览器将回退到 Inter 或系统默认字体。
        </p>
        <div className="p-4 mt-4 bg-white rounded border">
          <div style={{ fontFamily: 'Jost, Inter, system-ui, sans-serif' }} className="text-lg">
            ✓ 这行文字使用的是 Jost 字体 (如果加载成功)
          </div>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="mt-2 text-lg">
            ✗ 这行文字使用的是回退字体 (Inter/system-ui)
          </div>
        </div>
      </div>
    </div>
  )
}

export default FontTestPage 