import { type FormEvent } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '~source/shared/components'

interface LoginViewProps {
  authForm: { email: string; password: string; name: string }
  setAuthForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; name: string }>>
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  handleSubmit: (e: FormEvent) => void
  isLoading: boolean
  onSwitchToRegister: () => void
}

export function LoginView({
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  handleSubmit,
  isLoading,
  onSwitchToRegister
}: LoginViewProps) {
  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin w-[400px]">
      <div className="p-6 mx-auto max-w-lg bg-white rounded-xl shadow-sm dark:bg-gray-800">
        {/* Logo */}
        <div className="flex gap-2 items-center mb-6">
          <div className="flex justify-center items-center w-7 h-7 bg-theme-primary-600 rounded-lg dark:bg-theme-primary-500">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Finnger</span>
        </div>

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">
            Holla,
          </h1>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hey, welcome back to your special place
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 w-full text-sm placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              placeholder="stanley@gmail.com"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={authForm.password}
              onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              className="px-3 py-2 pr-10 w-full text-sm placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 text-gray-400 -translate-y-1/2 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex gap-2 items-center">
              <div className="flex justify-center items-center w-4 h-4 bg-theme-primary-600 rounded dark:bg-theme-primary-500">
                <Check className="w-2 h-2 text-white" />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Remember me</span>
            </label>
            <button type="button" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-theme-primary-600 dark:bg-theme-primary-500 hover:bg-theme-primary-700 dark:hover:bg-theme-primary-600"
          >
            {isLoading ? 'Loading...' : 'Sign In'}
          </Button>
        </form>

        {/* 切换到注册 */}
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?{' '}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={onSwitchToRegister}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  )
} 