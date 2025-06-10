import { Suspense, Component } from 'react'
import type { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import {
  useSuspenseUserSettings,
  useUpdateUserSettings
} from '~source/shared/hooks'
import {
  ThemeSettings,
  LanguageSettings,
  FontSizeSettings,
  AuthSection,
  SettingsLoadingSkeleton,
  SettingsErrorFallback
} from '~source/shared/components/settings'

// 简单的错误边界组件
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
        <SettingsErrorFallback
          error={this.state.error}
          resetErrorBoundary={() => {
            this.setState({ hasError: false, error: undefined })
            window.location.reload()
          }}
        />
      )
    }

    return this.props.children
  }
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
  const { data } = useSuspenseUserSettings()
  const updateSettings = useUpdateUserSettings()

  console.log('Settings data:', data)

  return (
    <div className="pb-48 overflow-y-auto scrollbar-macos-thin">
      {/* 设置标题 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 pb-0 bg-white">
        <Settings className="text-gray-700" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">设置</h1>
        {data.isDefault && (
          <span className="px-2 py-1 text-xs text-blue-600 bg-blue-100 rounded-full">
            首次设置
          </span>
        )}
      </div>

      {/* 欢迎信息 */}
      {data.isDefault && (
        <div className="p-4 m-4 border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="mb-2 text-lg font-medium text-blue-800">
            🎉 欢迎使用 Craz！
          </h2>
          <p className="text-sm text-blue-700">
            我们已经根据您的浏览器语言设置了默认配置，您可以在下方进行个性化调整
          </p>
        </div>
      )}

      {/* 主题设置 */}
      <ThemeSettings
        currentTheme={data.settings.theme}
        onThemeChange={(theme) => {
          console.log('Changing theme to:', theme)
          updateSettings.mutate({ theme })
        }}
      />

      {/* 分隔线 */}
      <div className="mx-4 border-t border-gray-200" />

      {/* 语言设置 */}
      <LanguageSettings
        currentLanguage={data.settings.language}
        onLanguageChange={(language) => {
          console.log('Changing language to:', language)
          updateSettings.mutate({ language })
        }}
      />

      {/* 分隔线 */}
      <div className="mx-4 border-t border-gray-200" />

      {/* 字体大小设置 */}
      <FontSizeSettings
        currentFontSize={data.settings.fontSize}
        onFontSizeChange={(fontSize) => {
          console.log('Changing font size to:', fontSize)
          updateSettings.mutate({ fontSize })
        }}
      />

      {/* 分隔线 */}
      <div className="mx-4 border-t border-gray-200" />

      {/* 账户状态 */}
      <AuthSection authStatus={data.authStatus} />

      {/* 高级设置 */}
      <div className="p-4">
        <h3 className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-800">
          <Settings className="text-gray-700" size={20} />
          高级设置
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-800">启用键盘快捷键</span>
              <p className="text-sm text-gray-600">使用 Cmd+Shift+T 快速打开扩展</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-800">显示标签页预览</span>
              <p className="text-sm text-gray-600">鼠标悬停时显示标签页缩略图</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-800">自动同步设置</span>
              <p className="text-sm text-gray-600">登录后自动同步到云端</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={data.authStatus.isLoggedIn}
              disabled={!data.authStatus.isLoggedIn}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* 更新状态提示 */}
      {updateSettings.isPending && (
        <div className="fixed z-50 bottom-4 right-4">
          <div className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-lg">
            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
            <span>保存设置中...</span>
          </div>
        </div>
      )}

      {updateSettings.isSuccess && (
        <div className="fixed z-50 bottom-4 right-4 animate-fade-in-up">
          <div className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>设置已保存</span>
          </div>
        </div>
      )}

      {updateSettings.isError && (
        <div className="fixed z-50 bottom-4 right-4">
          <div className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>保存失败，请重试</span>
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="p-4 mt-8 text-center">
        <div className="text-sm text-gray-500">
          <p>Craz Chrome Extension</p>
          <p className="mt-1">版本 1.0.0</p>
          <p className="mt-2">
            设置最后更新时间: {new Date(data.settings.updatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    </div>
  )
}
