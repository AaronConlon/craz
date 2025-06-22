import {
  AlertCircle,
  Check,
  Download,
  Globe,
  RefreshCw,
  RotateCcw,
  Settings,
  Shield,
  Type,
  Upload
} from 'lucide-react'
import { Component, Suspense, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button, ColorPicker, Toggle, useTheme } from '~source/shared/components'
import { useCustomColor } from '~source/shared/hooks/use-custom-color'
import { useUserProfile } from '~source/shared/hooks/use-user-profile'
import type { AppearanceMode, FontSize, Language, ThemeColor, UserSettings } from '~source/shared/types/settings'
import { APPEARANCE_MODES, FONT_SIZES, LANGUAGES, THEME_COLORS } from '~source/shared/types/settings'
import { cn } from '~source/shared/utils'
import { applyAppearanceMode, getActualDarkMode, getSystemDarkMode } from '~source/shared/utils/appearance-utils'

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
        <div className="flex flex-col justify-center items-center h-64 text-center bg-white dark:bg-gray-900">
          <AlertCircle className="mb-4 w-12 h-12 text-red-500 dark:text-red-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">设置加载失败</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            {this.state.error?.message || '未知错误'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.reload()
            }}
          >
            重新加载
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// 加载状态组件
function SettingsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
      <div className="flex gap-3 items-center">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
        <div className="w-20 h-5 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
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
    settings: originalSettings,
    updateSettings,
    isLoading,
    isFetching
  } = useUserProfile()
  const { setThemeColor, setAppearanceMode, setFontSize, setCustomColor } = useTheme()
  const { customColor: storedCustomColor, isLoading: customColorLoading } = useCustomColor()

  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // 当前显示的设置
  const currentSettings = originalSettings

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    // 立即应用主题变化
    if (key === 'themeColor') {
      setThemeColor(value as ThemeColor)
    } else if (key === 'appearanceMode') {
      setAppearanceMode(value as AppearanceMode)
    } else if (key === 'fontSize') {
      setFontSize(value as FontSize)
    }

    // 立即保存到服务器
    updateSettings.mutate({
      [key]: value
    } as Partial<UserSettings>)
  }

  const handleThemeColorChange = (themeColor: ThemeColor) => {
    handleSettingChange('themeColor', themeColor)
  }

  const handleAppearanceModeChange = (appearanceMode: AppearanceMode) => {
    handleSettingChange('appearanceMode', appearanceMode)
  }

  const handleFontSizeChange = (fontSize: FontSize) => {
    handleSettingChange('fontSize', fontSize)
  }

  const handleLanguageChange = (language: Language) => {
    handleSettingChange('language', language)
  }

  const handleCustomColorChange = (color: string) => {
    console.log('handleCustomColorChange called with:', color)

    // 检查是否是预设主题色
    const presetTheme = Object.entries(THEME_COLORS).find(([themeColor, colorValue]) =>
      themeColor !== 'custom' && colorValue === color
    )

    console.log('presetTheme found:', presetTheme)

    if (presetTheme) {
      // 如果是预设颜色，设置对应的主题
      console.log('Setting preset theme:', presetTheme[0])
      handleSettingChange('themeColor', presetTheme[0] as ThemeColor)
    } else {
      // 如果是自定义颜色，设置自定义主题并保存颜色
      console.log('Setting custom color:', color)
      setCustomColor(color)
      handleSettingChange('themeColor', 'custom')
    }
  }

  // 从云端加载设置
  const handleDownloadFromCloud = async () => {
    setIsDownloading(true)
    try {
      // 调用 background script 从云端下载设置
      const response = await chrome.runtime.sendMessage({
        name: "user-profile-action",
        body: {
          action: "downloadSettingsFromCloud"
        }
      })

      if (response.success && response.data?.settings) {
        const cloudSettings = response.data.settings

        // 应用云端设置
        setThemeColor(cloudSettings.themeColor)
        setAppearanceMode(cloudSettings.appearanceMode)
        setFontSize(cloudSettings.fontSize)

        toast.success('从云端加载成功', {
          description: response.data.message || '已同步云端的最新设置'
        })
      } else {
        toast.error('从云端加载失败', {
          description: response.data?.message || '请检查网络连接或稍后重试'
        })
      }
    } catch (error) {
      toast.error('从云端加载失败', {
        description: '请检查网络连接或稍后重试'
      })
      console.error('Failed to download from cloud:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // 上传设置到云端
  const handleUploadToCloud = async () => {
    if (!currentSettings) return

    setIsUploading(true)
    try {
      // 调用 background script 上传到云端
      const response = await chrome.runtime.sendMessage({
        name: "user-profile-action",
        body: {
          action: "uploadSettingsToCloud"
        }
      })

      if (response.success) {
        toast.success('上传到云端成功', {
          description: response.data?.message || '您的设置已保存到云端'
        })
      } else {
        toast.error('上传到云端失败', {
          description: response.data?.message || '请稍后重试或检查网络连接'
        })
      }
    } catch (error) {
      toast.error('上传到云端失败', {
        description: '请稍后重试或检查网络连接'
      })
      console.error('Failed to upload to cloud:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // 重置为默认设置
  const handleResetToDefaults = () => {
    const defaultSettings = {
      themeColor: 'amber' as ThemeColor,
      appearanceMode: 'system' as AppearanceMode,
      language: 'zh-CN' as Language,
      fontSize: 'medium' as FontSize,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // 立即应用和保存默认设置
    setThemeColor(defaultSettings.themeColor)
    setAppearanceMode(defaultSettings.appearanceMode)
    setFontSize(defaultSettings.fontSize)

    updateSettings.mutate({
      themeColor: defaultSettings.themeColor,
      appearanceMode: defaultSettings.appearanceMode,
      language: defaultSettings.language,
      fontSize: defaultSettings.fontSize
    })

    toast.info('已重置为默认设置', {
      description: '设置已自动保存'
    })
  }

  if (isLoading || !currentSettings) {
    return <SettingsLoadingSkeleton />
  }

  return (
    <div className="overflow-y-auto relative pb-32 h-full bg-gray-50 dark:bg-gray-900 scrollbar-macos-thin">
      {/* 标题栏 */}
      <div className="flex sticky top-0 z-10 justify-between items-center border-b border-gray-200 backdrop-blur-sm dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex gap-3 items-center">
            <Settings className="text-gray-700 dark:text-gray-300" size={20} />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">设置</h1>
          </div>

          {isFetching && (
            <RefreshCw className="w-4 h-4 animate-spin text-theme-primary-600 dark:text-theme-primary-400" />
          )}
        </div>
        <p className="p-4 text-sm text-theme-primary-600 dark:text-theme-primary-400">
          自由定义您的浏览器体验 🚀🚀🚀
        </p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* 主题色设置 */}
        <section>
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">主题色</h3>
          </div>

          <div className="max-w-xs">
            <ColorPicker
              color={currentSettings.themeColor === 'custom' && storedCustomColor ? storedCustomColor : THEME_COLORS[currentSettings.themeColor]}
              onChange={handleCustomColorChange}
              className="w-full"
            />
          </div>
        </section>

        {/* 界面模式 */}
        <section>
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">界面模式</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(APPEARANCE_MODES).map(([mode, label]) => (
              <div
                key={mode}
                className={cn(
                  "relative p-3 bg-white dark:bg-gray-800 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                  currentSettings.appearanceMode === mode
                    ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-50 dark:bg-theme-primary-900"
                    : "border-gray-200 dark:border-gray-600 hover:border-theme-primary-200 dark:hover:border-theme-primary-400"
                )}
                onClick={() => handleAppearanceModeChange(mode as AppearanceMode)}
              >
                <div className="mb-3">
                  <div className={cn(
                    "overflow-hidden w-full h-16 rounded border border-gray-200 dark:border-gray-600",
                    mode === 'light' && "bg-white",
                    mode === 'dark' && "bg-gray-900",
                    mode === 'system' && "bg-gradient-to-br from-gray-100 to-gray-900"
                  )}>
                    <div className={cn(
                      "flex gap-1 items-center p-2",
                      mode === 'light' && "bg-gray-50",
                      mode === 'dark' && "bg-gray-800",
                      mode === 'system' && "bg-gray-200"
                    )}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </div>
                    </div>
                    <div className="px-2 py-1 space-y-1">
                      <div className="flex gap-2 items-center">
                        <div className="w-3 h-1 rounded bg-theme-primary-500" />
                        <div className={cn(
                          "flex-1 h-1 rounded",
                          mode === 'light' && "bg-gray-200",
                          mode === 'dark' && "bg-gray-600",
                          mode === 'system' && "bg-gray-400"
                        )} />
                      </div>
                      <div className={cn(
                        "w-full h-4 rounded",
                        mode === 'light' && "bg-gray-100",
                        mode === 'dark' && "bg-gray-700",
                        mode === 'system' && "bg-gray-500"
                      )} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className={cn(
                    "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                    currentSettings.appearanceMode === mode
                      ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-500 dark:bg-theme-primary-400"
                      : "border-gray-300 dark:border-gray-500"
                  )}>
                    {currentSettings.appearanceMode === mode && (
                      <Check className="w-2 h-2 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 语言设置 */}
        <section>
          <div className="mb-4">
            <h3 className="flex gap-2 items-center mb-1 text-sm font-medium text-gray-900 dark:text-white">
              <Globe size={16} className="text-gray-700 dark:text-gray-300" />
              语言
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(LANGUAGES).map(([lang, label]) => (
              <div
                key={lang}
                className={cn(
                  "relative p-3 bg-white dark:bg-gray-800 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                  currentSettings.language === lang
                    ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-50 dark:bg-theme-primary-900"
                    : "border-gray-200 dark:border-gray-600 hover:border-theme-primary-200 dark:hover:border-theme-primary-400"
                )}
                onClick={() => handleLanguageChange(lang as Language)}
              >
                <div className="flex gap-2 items-center">
                  <div className={cn(
                    "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                    currentSettings.language === lang
                      ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-500 dark:bg-theme-primary-400"
                      : "border-gray-300 dark:border-gray-500"
                  )}>
                    {currentSettings.language === lang && (
                      <Check className="w-2 h-2 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 字体大小设置 */}
        <section>
          <div className="mb-4">
            <h3 className="flex gap-2 items-center mb-1 text-sm font-medium text-gray-900 dark:text-white">
              <Type size={16} className="text-gray-700 dark:text-gray-300" />
              字体大小
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(FONT_SIZES).map(([size, config]) => (
              <div
                key={size}
                className={cn(
                  "relative p-4 bg-white dark:bg-gray-800 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                  currentSettings.fontSize === size
                    ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-50 dark:bg-theme-primary-900"
                    : "border-gray-200 dark:border-gray-600 hover:border-theme-primary-200 dark:hover:border-theme-primary-400"
                )}
                onClick={() => handleFontSizeChange(size as FontSize)}
              >
                <div className="text-center">
                  <div className="mb-2">
                    <span
                      className="font-medium text-gray-900 dark:text-white"
                      style={{ fontSize: config.size }}
                    >
                      Aa
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center items-center">
                    <div className={cn(
                      "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                      currentSettings.fontSize === size
                        ? "border-theme-primary-500 dark:border-theme-primary-400 bg-theme-primary-500 dark:text-white"
                        : "border-gray-300 dark:border-gray-500"
                    )}>
                      {currentSettings.fontSize === size && (
                        <Check className="w-2 h-2 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{config.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 功能设置 */}
        <section>
          <div className="mb-4">
            <h3 className="flex gap-2 items-center mb-1 text-sm font-medium text-gray-900 dark:text-white">
              <Settings size={16} className="text-gray-700 dark:text-gray-300" />
              功能设置
            </h3>
          </div>

          <div className="space-y-4">

            {/* 隐私设置 */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex gap-3 items-center mb-3">
                <Shield size={16} className="text-theme-primary-600 dark:text-theme-primary-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">隐私设置</h4>
              </div>

              <div className="space-y-3">
                <Toggle
                  description="通过邮件接收产品更新和重要通知"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </section>


      </div>

      {/* 底部操作按钮 */}
      <div className="absolute inset-x-0 bottom-0 p-4 w-full border-t border-gray-200 backdrop-blur-sm dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={handleResetToDefaults}
          >
            重置为默认
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={16} />}
              loading={isDownloading}
              onClick={handleDownloadFromCloud}
            >
              从云端加载
            </Button>
            <Button
              size="sm"
              icon={<Upload size={16} />}
              loading={isUploading}
              onClick={handleUploadToCloud}
            >
              上传到云端
            </Button>
          </div>
        </div>
      </div>


    </div>
  )
}
