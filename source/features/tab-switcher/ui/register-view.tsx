import { type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '~source/shared/components'

interface RegisterViewProps {
  authForm: { email: string; password: string; name: string }
  setAuthForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; name: string }>>
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  handleSubmit: (e: FormEvent) => void
  isLoading: boolean
  onSwitchToLogin: () => void
}

export function RegisterView({
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  handleSubmit,
  isLoading,
  onSwitchToLogin
}: RegisterViewProps) {
  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin w-[400px]">
      <div className="p-6 mx-auto max-w-lg bg-white rounded-xl shadow-sm dark:bg-gray-800">
        {/* Logo */}
        <div className="flex gap-2 items-center mb-6">
          <div className="flex justify-center items-center w-7 h-7 bg-purple-600 rounded-lg dark:bg-purple-500">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Finnger</span>
        </div>

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome,
          </h1>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            Join Us
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Create your account to get started
          </p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={authForm.name}
              onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 w-full text-sm placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              placeholder="Full Name"
              required
            />
          </div>

          <div>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 w-full text-sm placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              placeholder="Email Address"
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600"
          >
            {isLoading ? 'Loading...' : 'Sign Up'}
          </Button>
        </form>

        {/* 切换到登录 */}
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={onSwitchToLogin}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
} 