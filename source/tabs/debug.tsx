import React, { useState, useEffect } from 'react'
import { ChromeApiService } from '~source/shared/api/chrome'
import "~style.css"
import "data-text:~contents/fonts.css"
import { TabMenu } from '../features/tab-switcher/ui/tab-menu'
import type { Tab } from '../features/tab-switcher/types'

/**
 * Tabs API 调试页面
 * 用于测试和调试 Chrome tabs API 的权限和功能
 */
function TabsDebugPage() {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [menuState, setMenuState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 }
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testDirectTabsAPI = async () => {
    setLoading(true)
    setError(null)
    addLog("开始测试直接调用 tabs API...")

    try {
      // 检查 chrome.tabs 是否可用
      if (!chrome?.tabs) {
        throw new Error("chrome.tabs API 不可用")
      }

      addLog("chrome.tabs API 可用，尝试获取所有标签页...")
      const allTabs = await chrome.tabs.query({})
      addLog(`成功获取 ${allTabs.length} 个标签页`)
      setTabs(allTabs)

      // 获取活动标签页
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      addLog(`当前活动标签页: ${currentTab?.title || '未知'}`)
      setActiveTab(currentTab)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      addLog(`直接调用失败: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const testChromeApiService = async () => {
    setLoading(true)
    setError(null)
    addLog("开始测试 ChromeApiService...")

    try {
      addLog("通过 ChromeApiService 获取所有标签页...")
      const allTabs = await ChromeApiService.getAllTabs()
      addLog(`成功获取 ${allTabs.length} 个标签页`)
      setTabs(allTabs)

      addLog("通过 ChromeApiService 获取活动标签页...")
      const currentTab = await ChromeApiService.getActiveTab()
      addLog(`当前活动标签页: ${currentTab?.title || '未知'}`)
      setActiveTab(currentTab)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      addLog(`ChromeApiService 失败: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const testPermissions = async () => {
    addLog("检查权限状态...")

    try {
      if (chrome?.permissions) {
        const hasTabsPermission = await chrome.permissions.contains({ permissions: ['tabs'] })
        addLog(`tabs 权限: ${hasTabsPermission ? '已授权' : '未授权'}`)

        const hasActiveTabPermission = await chrome.permissions.contains({ permissions: ['activeTab'] })
        addLog(`activeTab 权限: ${hasActiveTabPermission ? '已授权' : '未授权'}`)

        const allPermissions = await chrome.permissions.getAll()
        addLog(`所有权限: ${JSON.stringify(allPermissions.permissions)}`)
      } else {
        addLog("chrome.permissions API 不可用")
      }
    } catch (err) {
      addLog(`权限检查失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault()
    setMenuState({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY }
    })
  }

  const handleCloseMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }))
  }

  const handleMenuAction = (action: string, tab: Tab) => {
    console.log('🎯 Menu action:', action, 'Tab:', tab.title)

    // 模拟不同的操作处理
    switch (action) {
      case 'share-website-copy-url':
        console.log('✅ 复制标题和网址:', tab.title, tab.url)
        break
      case 'share-website-copy-markdown':
        console.log('✅ 复制 Markdown 链接:', `[${tab.title}](${tab.url})`)
        break
      case 'share-website-to-x':
        console.log('✅ 分享到 X:', tab.title, tab.url)
        break
      default:
        console.log('🔍 其他操作:', action)
    }
  }

  useEffect(() => {
    addLog("页面加载完成")
    testPermissions()
  }, [])

  // 模拟一个标签页数据
  const mockTab: Tab = {
    id: 1,
    url: 'https://example.com',
    title: '测试网站',
    favIconUrl: 'https://example.com/favicon.ico',
    active: false,
    highlighted: false,
    pinned: false,
    selected: false,
    windowId: 1,
    index: 0,
    incognito: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1
  }

  return (
    <div className="p-6 mx-auto max-w-4xl min-h-screen bg-white">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Chrome Tabs API 调试页面</h1>

      {/* 测试按钮 */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testDirectTabsAPI}
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试直接调用 Tabs API'}
          </button>

          <button
            onClick={testChromeApiService}
            disabled={loading}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 ChromeApiService'}
          </button>

          <button
            onClick={testPermissions}
            className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
          >
            检查权限
          </button>

          <button
            onClick={clearLogs}
            className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            清空日志
          </button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded border border-red-400">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 结果显示 */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        {/* 活动标签页 */}
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="mb-2 text-lg font-semibold">当前活动标签页</h2>
          {activeTab ? (
            <div className="space-y-1 text-sm">
              <p><strong>标题:</strong> {activeTab.title}</p>
              <p><strong>URL:</strong> {activeTab.url}</p>
              <p><strong>ID:</strong> {activeTab.id}</p>
              <p><strong>窗口ID:</strong> {activeTab.windowId}</p>
            </div>
          ) : (
            <p className="text-gray-500">暂无数据</p>
          )}
        </div>

        {/* 所有标签页概览 */}
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="mb-2 text-lg font-semibold">所有标签页概览</h2>
          <p className="text-sm">总数: {tabs.length}</p>
          {tabs.length > 0 && (
            <div className="overflow-y-auto mt-2 max-h-40">
              {tabs.slice(0, 5).map((tab, index) => (
                <div key={tab.id} className="text-xs text-gray-600 truncate">
                  {index + 1}. {tab.title}
                </div>
              ))}
              {tabs.length > 5 && (
                <p className="mt-1 text-xs text-gray-400">还有 {tabs.length - 5} 个标签页...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 日志输出 */}
      <div className="p-4 font-mono text-sm text-green-400 bg-black rounded">
        <h2 className="mb-2 font-semibold text-white">调试日志</h2>
        <div className="overflow-y-auto space-y-1 max-h-60">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            测试说明
          </h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• 右键点击下方的测试区域打开菜单</li>
            <li>• 悬停到"分享网站"菜单项应该显示子菜单</li>
            <li>• 子菜单应该包含：复制标题和网址、复制 Markdown 链接、分享到 X</li>
            <li>• 检查控制台输出确认功能正常</li>
          </ul>
        </div>

        <div
          className="p-8 bg-white rounded-lg border border-gray-200 transition-colors cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          onContextMenu={handleRightClick}
        >
          <div className="text-center">
            <div className="mb-2 text-4xl">🖱️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              右键点击这里
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              测试右键菜单和子菜单功能
            </p>
            <div className="p-3 mt-4 bg-gray-100 rounded-lg dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                模拟标签页: {mockTab.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {mockTab.url}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
          <h3 className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            🔍 调试检查点
          </h3>
          <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>1. 右键菜单是否正常显示？</li>
            <li>2. "分享网站" 菜单项是否有右箭头 ➤？</li>
            <li>3. 悬停到 "分享网站" 是否显示子菜单？</li>
            <li>4. 子菜单是否在正确位置显示？</li>
            <li>5. 点击子菜单项是否触发正确的 action？</li>
            <li>6. 鼠标离开是否正确隐藏子菜单？</li>
          </ul>
        </div>
      </div>

      {/* 右键菜单组件 */}
      <TabMenu
        isOpen={menuState.isOpen}
        onClose={handleCloseMenu}
        tab={mockTab}
        type="current"
        position={menuState.position}
        onAction={handleMenuAction}
      />
    </div>
  )
}

export default TabsDebugPage 