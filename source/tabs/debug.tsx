import React, { useState, useEffect } from 'react'
import { ChromeApiService } from '~source/shared/api/chrome'

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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
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

  useEffect(() => {
    addLog("页面加载完成")
    testPermissions()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Chrome Tabs API 调试页面</h1>

      {/* 测试按钮 */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={testDirectTabsAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试直接调用 Tabs API'}
          </button>

          <button
            onClick={testChromeApiService}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 ChromeApiService'}
          </button>

          <button
            onClick={testPermissions}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            检查权限
          </button>

          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            清空日志
          </button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 结果显示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 活动标签页 */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">当前活动标签页</h2>
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
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">所有标签页概览</h2>
          <p className="text-sm">总数: {tabs.length}</p>
          {tabs.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {tabs.slice(0, 5).map((tab, index) => (
                <div key={tab.id} className="text-xs text-gray-600 truncate">
                  {index + 1}. {tab.title}
                </div>
              ))}
              {tabs.length > 5 && (
                <p className="text-xs text-gray-400 mt-1">还有 {tabs.length - 5} 个标签页...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 日志输出 */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm">
        <h2 className="text-white font-semibold mb-2">调试日志</h2>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TabsDebugPage 