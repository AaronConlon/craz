import { User, LogIn, LogOut, Cloud, CloudOff } from 'lucide-react'
import type { AuthStatus } from '~source/shared/types/settings'

interface AuthSectionProps {
  authStatus: AuthStatus
}

export function AuthSection({ authStatus }: AuthSectionProps) {
  const handleLogin = () => {
    // TODO: 实现登录逻辑
    console.log('Login clicked')
  }

  const handleLogout = () => {
    // TODO: 实现登出逻辑
    console.log('Logout clicked')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <User className="text-gray-700" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">账户状态</h3>
      </div>

      {authStatus.isLoggedIn ? (
        <div className="p-4 border border-theme-primary-200 rounded-lg bg-theme-primary-50 dark:border-theme-primary-800 dark:bg-theme-primary-950">
          <div className="flex items-center gap-3 mb-3">
            <Cloud className="text-theme-primary-600 dark:text-theme-primary-400" size={20} />
            <div>
              <h4 className="font-medium text-theme-primary-800 dark:text-theme-primary-200">已登录</h4>
              <p className="text-sm text-theme-primary-600 dark:text-theme-primary-400">
                {authStatus.username || '用户'}，设置已同步到云端
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-theme-primary-600 dark:text-theme-primary-400">
              <p>• 设置自动同步</p>
              <p>• 跨设备共享</p>
              <p>• 数据安全备份</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-theme-primary-600 transition-colors bg-white border border-theme-primary-200 rounded-lg hover:bg-theme-primary-50 dark:text-theme-primary-400 dark:bg-gray-800 dark:border-theme-primary-800 dark:hover:bg-theme-primary-950"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <CloudOff className="text-gray-400" size={20} />
            <div>
              <h4 className="font-medium text-gray-800">未登录</h4>
              <p className="text-sm text-gray-600">
                登录后可同步设置到云端，多设备共享
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>• 设置仅保存在本地</p>
              <p>• 无法跨设备同步</p>
              <p>• 清除浏览器数据会丢失</p>
            </div>

            <button
              onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-theme-primary-600 rounded-lg hover:bg-theme-primary-700"
            >
              <LogIn size={16} />
              立即登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
