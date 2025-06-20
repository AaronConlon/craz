import {
  AlertCircle,
  Check,
  RefreshCw,
  Settings
} from 'lucide-react'
import { Component, Suspense, type ReactNode } from 'react'

import { useUserProfile } from '~source/shared/hooks/use-user-profile'
import type { Theme } from '~source/shared/types/settings'
import { THEME_COLORS } from '~source/shared/types/settings'
import { cn } from '~source/shared/utils'

// 错误边界组件
class SettingsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Settings error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <AlertCircle className="mb-4 w-12 h-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800">设置加载失败</h3>
          <p className="mb-4 text-sm text-gray-600">
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.reload()
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 加载状态组件
function SettingsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex gap-3 items-center">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-5 bg-gray-200 rounded animate-pulse" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function SettingsView() {
  return (
    <SettingsErrorBoundary>
      <Suspense fallback={<SettingsLoadingSkeleton />}>
        <SettingsContent />
      </Suspense>
    </SettingsErrorBoundary>
  )
}

function SettingsContent() {
  const {
    settings,
    updateSettings,
    isLoading,
    isFetching
  } = useUserProfile()

  const handleUpdateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    updateSettings.mutate({ [key]: value })
  }

  if (isLoading) {
    return <SettingsLoadingSkeleton />
  }

  return (
    <div className="overflow-y-auto h-full bg-gray-50 scrollbar-macos-thin">
      {/* 标题栏 */}
      <div className="sticky top-0 z-10 border-b border-gray-200 backdrop-blur-sm bg-white/80">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex gap-3 items-center">
            <Settings className="text-gray-700" size={20} />
            <h1 className="text-lg font-semibold text-gray-900">外观</h1>
          </div>

          {isFetching && (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          )}
        </div>
        <p className="px-6 pb-4 text-sm text-gray-600">
          更改 Craz 在浏览器中的外观和感觉。
        </p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* 主题色设置 */}
        <section>
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium text-gray-900">主题色</h3>
            <p className="text-xs text-gray-600">更新您的仪表板为您的品牌颜色。</p>
          </div>

          <div className="flex gap-3 items-center">
            {/* 预设颜色 */}
            <div className="flex gap-2">
              {Object.entries(THEME_COLORS).map(([theme, color]) => (
                <button
                  key={theme}
                  onClick={() => handleUpdateSetting('theme', theme as Theme)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                    settings.theme === theme
                      ? "border-gray-400 ring-2 ring-blue-500 ring-offset-2"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  title={theme}
                />
              ))}
            </div>

            {/* 自定义颜色 */}
            <div className="flex gap-2 items-center ml-4">
              <span className="text-xs font-medium text-gray-700">自定义</span>
              <div className="flex gap-1 items-center">
                <span className="text-xs text-gray-500">#</span>
                <input
                  type="text"
                  placeholder="F5F5F5"
                  className="px-2 py-1 w-20 text-xs bg-white rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 界面主题 */}
        <section>
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium text-gray-900">界面主题</h3>
            <p className="text-xs text-gray-600">选择或自定义您的 UI 主题。</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* 系统偏好 */}
            <div
              className={cn(
                "relative p-3 bg-white border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                settings.theme === 'blue' ? "border-blue-500" : "border-gray-200"
              )}
              onClick={() => handleUpdateSetting('theme', 'blue')}
            >
              <div className="mb-3">
                <div className="overflow-hidden w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded border">
                  <div className="flex gap-1 items-center p-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                  </div>
                  <div className="px-2 space-y-1">
                    <div className="flex gap-2 items-center">
                      <div className="w-3 h-1 bg-blue-500 rounded" />
                      <div className="flex-1 h-1 bg-gray-300 rounded" />
                    </div>
                    <div className="w-full h-6 bg-gray-800 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className={cn(
                  "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                  settings.theme === 'blue' ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {settings.theme === 'blue' && (
                    <Check className="w-2 h-2 text-white" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900">系统偏好</span>
              </div>
            </div>

            {/* 浅色模式 */}
            <div
              className={cn(
                "relative p-3 bg-white border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                settings.theme === 'green' ? "border-blue-500" : "border-gray-200"
              )}
              onClick={() => handleUpdateSetting('theme', 'green')}
            >
              <div className="mb-3">
                <div className="overflow-hidden w-full h-16 bg-white rounded border">
                  <div className="flex gap-1 items-center p-2 bg-gray-50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                  </div>
                  <div className="px-2 py-1 space-y-1">
                    <div className="flex gap-2 items-center">
                      <div className="w-3 h-1 bg-blue-500 rounded" />
                      <div className="flex-1 h-1 bg-gray-200 rounded" />
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className={cn(
                  "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                  settings.theme === 'green' ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {settings.theme === 'green' && (
                    <Check className="w-2 h-2 text-white" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900">浅色</span>
              </div>
            </div>

            {/* 深色模式 */}
            <div
              className={cn(
                "relative p-3 bg-white border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                settings.theme === 'purple' ? "border-blue-500" : "border-gray-200"
              )}
              onClick={() => handleUpdateSetting('theme', 'purple')}
            >
              <div className="mb-3">
                <div className="overflow-hidden w-full h-16 bg-gray-900 rounded border">
                  <div className="flex gap-1 items-center p-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                  </div>
                  <div className="px-2 py-1 space-y-1">
                    <div className="flex gap-2 items-center">
                      <div className="w-3 h-1 bg-blue-400 rounded" />
                      <div className="flex-1 h-1 bg-gray-600 rounded" />
                    </div>
                    <div className="w-full h-4 bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className={cn(
                  "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                  settings.theme === 'purple' ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {settings.theme === 'purple' && (
                    <Check className="w-2 h-2 text-white" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900">深色</span>
              </div>
            </div>
          </div>
        </section>

        {/* 功能设置 */}
        <section className="space-y-4">
          {/* 分组设置 */}
          <div className="flex justify-between items-center py-2">
            <div className="flex gap-3 items-center">
              <div className={cn(
                "w-6 h-3 bg-blue-500 rounded-full p-0.5 cursor-pointer transition-colors",
                "flex items-center"
              )}>
                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-sm font-medium text-gray-900">分组</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-600">按状态</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 排序设置 */}
          <div className="flex justify-between items-center py-2">
            <div className="flex gap-3 items-center">
              <div className={cn(
                "w-6 h-3 bg-blue-500 rounded-full p-0.5 cursor-pointer transition-colors",
                "flex items-center"
              )}>
                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-sm font-medium text-gray-900">排序</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-600">最后创建</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 显示子项目 */}
          <div className="flex justify-between items-center py-2">
            <div className="flex gap-3 items-center">
              <div className={cn(
                "w-6 h-3 bg-blue-500 rounded-full p-0.5 cursor-pointer transition-colors",
                "flex items-center"
              )}>
                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-sm font-medium text-gray-900">显示子项目</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-600">所有子项目</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>


      </div>

      {/* 底部操作按钮 */}
      <div className="sticky bottom-0 p-6 border-t border-gray-200 backdrop-blur-sm bg-white/80">
        <div className="flex justify-between items-center">
          <button
            className="text-sm text-gray-600 transition-colors hover:text-gray-800"
            onClick={() => {
              // 重置为默认设置
              handleUpdateSetting('theme', 'blue')
              handleUpdateSetting('language', 'zh-CN')
              handleUpdateSetting('fontSize', 'medium')
            }}
          >
            重置为默认
          </button>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm text-gray-600 rounded-md border border-gray-300 transition-colors hover:bg-gray-50">
              取消
            </button>
            <button
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? '保存中...' : '保存更改'}
            </button>
          </div>
        </div>
      </div>

      {/* 状态提示 */}
      {updateSettings.isPending && (
        <div className="fixed right-4 bottom-4 z-50">
          <div className="flex gap-2 items-center px-3 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>保存设置中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
