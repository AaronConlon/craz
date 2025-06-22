import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../button'

interface SettingsErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
}

export function SettingsErrorFallback({ error, resetErrorBoundary }: SettingsErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center">
      <AlertTriangle className="mb-4 w-16 h-16 text-red-500" />

      <h2 className="mb-2 text-xl font-semibold text-gray-800">
        设置加载失败
      </h2>

      <p className="mb-6 text-gray-600">
        {error?.message || '无法加载用户设置，请稍后重试'}
      </p>

      {resetErrorBoundary && (
        <Button
          onClick={resetErrorBoundary}
          variant="default"
          size="lg"
          icon={<RefreshCw size={16} />}
        >
          重新加载
        </Button>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>如果问题持续存在，请尝试：</p>
        <ul className="mt-2 space-y-1 text-left">
          <li>• 刷新扩展页面</li>
          <li>• 重启浏览器</li>
          <li>• 检查网络连接</li>
        </ul>
      </div>
    </div>
  )
}
