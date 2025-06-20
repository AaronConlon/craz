import React from 'react'
import { Favicon, TabFavicon } from './favicon'

/**
 * Favicon 组件使用示例
 * 展示多级回退策略的不同场景
 */
export function FaviconExample() {
  const testCases = [
    {
      name: "正常网站 - GitHub",
      src: "https://github.com/favicon.ico",
      description: "应该直接加载成功"
    },
    {
      name: "失效的 favicon URL",
      src: "https://example-invalid-domain-12345.com/favicon.ico",
      description: "应该回退到 twenty-icons.com"
    },
    {
      name: "Base64 图片",
      src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzM0OThmMyIvPgo8L3N2Zz4K",
      description: "应该直接使用 Base64"
    },
    {
      name: "Chrome 内部页面",
      src: "chrome://settings/favicon.ico",
      description: "应该直接使用默认图标"
    },
    {
      name: "Airbnb - twenty-icons 测试",
      src: "https://airbnb.com/invalid-favicon.ico",
      description: "应该回退到 twenty-icons.com/airbnb.com"
    }
  ]

  const mockTab = {
    favIconUrl: "https://github.com/favicon.ico",
    url: "https://github.com",
    title: "GitHub"
  }

  return (
    <div className="p-6 space-y-6 bg-white">
      <div>
        <h2 className="mb-4 text-xl font-bold">Favicon 组件测试</h2>
        <p className="mb-6 text-gray-600">
          测试多级回退策略：原始 URL → twenty-icons.com → 默认图标
        </p>
      </div>

      {/* 基本测试用例 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本测试用例</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {testCases.map((testCase, index) => (
            <div key={index} className="p-4 space-y-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Favicon src={testCase.src} size={24} />
                <div>
                  <div className="font-medium">{testCase.name}</div>
                  <div className="text-sm text-gray-500">{testCase.description}</div>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-400 break-all">
                {testCase.src}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 不同尺寸测试 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">不同尺寸测试</h3>
        <div className="flex items-center space-x-4">
          {[12, 16, 20, 24, 32, 48].map(size => (
            <div key={size} className="text-center">
              <Favicon src="https://github.com/favicon.ico" size={size} />
              <div className="mt-1 text-xs text-gray-500">{size}px</div>
            </div>
          ))}
        </div>
      </div>

      {/* TabFavicon 测试 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">TabFavicon 组件测试</h3>
        <div className="flex items-center p-3 space-x-3 rounded-lg border">
          <TabFavicon tab={mockTab} size={20} />
          <div>
            <div className="font-medium">{mockTab.title}</div>
            <div className="text-sm text-gray-500">{mockTab.url}</div>
          </div>
        </div>
      </div>

      {/* 实时测试 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">实时测试</h3>
        <div className="p-4 rounded-lg border">
          <p className="mb-3 text-sm text-gray-600">
            输入一个 URL 来测试 favicon 加载：
          </p>
          <TestInput />
        </div>
      </div>
    </div>
  )
}

/**
 * 实时测试输入组件
 */
function TestInput() {
  const [url, setUrl] = React.useState('https://example.com/favicon.ico')
  const [testKey, setTestKey] = React.useState(0)

  const handleTest = () => {
    setTestKey(prev => prev + 1) // 强制重新渲染
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-md border"
          placeholder="输入 favicon URL..."
        />
        <button
          onClick={handleTest}
          className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          测试
        </button>
      </div>

      {url && (
        <div className="flex items-center p-3 space-x-3 bg-gray-50 rounded-md">
          <Favicon key={testKey} src={url} size={24} />
          <div className="text-sm">
            <div className="font-medium">测试结果</div>
            <div className="font-mono text-gray-500 break-all">{url}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FaviconExample
