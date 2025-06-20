import { useState, type FormEvent } from 'react'
import {
  User,
  Mail,
  Globe,
  UserCheck,
  Calendar,
  DollarSign,
  Archive,
  ShoppingBag,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  X,
  Check,
  Flag
} from 'lucide-react'

import { cn } from '~source/shared/utils'
import { useUserProfile } from '~source/shared/hooks/use-user-profile'

export function ProfileView() {
  const {
    user,
    isLoggedIn,
    login,
    register,
    logout,
    isLoading
  } = useUserProfile()

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [authForm, setAuthForm] = useState<{
    email: string
    password: string
    name: string
  }>({
    email: '',
    password: '',
    name: ''
  })

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (authMode === 'login') {
      login.mutate({
        email: authForm.email,
        password: authForm.password
      })
    } else {
      register.mutate({
        email: authForm.email,
        password: authForm.password,
        username: authForm.name
      })
    }
  }

  const handleLogout = () => {
    logout.mutate()
    setAuthForm({ email: '', password: '', name: '' })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 animate-spin border-t-transparent" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginRegisterView
      authMode={authMode}
      setAuthMode={setAuthMode}
      authForm={authForm}
      setAuthForm={setAuthForm}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      handleAuthSubmit={handleAuthSubmit}
      isLoading={login.isPending || register.isPending}
    />
  }

  return <UserProfileView user={user} onLogout={handleLogout} />
}

// 登录/注册视图
interface LoginRegisterViewProps {
  authMode: 'login' | 'register'
  setAuthMode: (mode: 'login' | 'register') => void
  authForm: { email: string; password: string; name: string }
  setAuthForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; name: string }>>
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  handleAuthSubmit: (e: FormEvent) => void
  isLoading: boolean
}

function LoginRegisterView({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  handleAuthSubmit,
  isLoading
}: LoginRegisterViewProps) {
  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin mt-[64px]">
      <div className="p-6 mx-auto max-w-lg bg-white rounded-xl shadow-sm">
        {/* Logo */}
        <div className="flex gap-2 items-center mb-6">
          <div className="flex justify-center items-center w-7 h-7 bg-purple-600 rounded-lg">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Finnger</span>
        </div>

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold text-gray-900">
            {authMode === 'login' ? 'Holla,' : 'Welcome,'}
          </h1>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">
            {authMode === 'login' ? 'Welcome Back' : 'Join Us'}
          </h2>
          <p className="text-sm text-gray-600">
            {authMode === 'login'
              ? 'Hey, welcome back to your special place'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* 登录/注册表单 */}
        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {authMode === 'register' && (
            <div>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Full Name"
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={authMode === 'login' ? 'stanley@gmail.com' : 'Email Address'}
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={authForm.password}
              onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              className="px-3 py-2 pr-10 w-full text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 text-gray-400 -translate-y-1/2 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {authMode === 'login' && (
            <div className="flex justify-between items-center">
              <label className="flex gap-2 items-center">
                <div className="flex justify-center items-center w-4 h-4 bg-purple-600 rounded">
                  <Check className="w-2 h-2 text-white" />
                </div>
                <span className="text-xs text-gray-700">Remember me</span>
              </label>
              <button type="button" className="text-xs text-gray-500 hover:text-gray-700">
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="py-2 w-full text-sm font-medium text-white bg-purple-600 rounded-lg transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* 切换模式 */}
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 用户信息视图
interface UserProfileViewProps {
  user: any
  onLogout: () => void
}

function UserProfileView({ user, onLogout }: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    country: 'United States',
    username: user?.username || user?.name?.toLowerCase().replace(' ', '') || ''
  })

  const handleSave = () => {
    // TODO: 实现保存逻辑
    setIsEditing(false)
  }

  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin">
      <div className="p-4 mx-auto max-w-3xl bg-white rounded-xl shadow-sm">
        {/* 头部 */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            {/* 头像 */}
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full"
              />
              <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-5 h-5 bg-blue-500 rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* 用户信息 */}
            <div>
              <div className="flex gap-2 items-center mb-1">
                <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                <span className="px-2 py-0.5 text-xs text-green-700 bg-green-100 rounded-full">
                  Subscribed
                </span>
              </div>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1 items-center">
            <button className="flex gap-1 items-center px-3 py-1.5 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
              <Archive size={14} />
              Archive
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
              View orders
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4 pb-4 mb-6 border-b border-gray-200">
          <div>
            <p className="mb-1 text-xs text-gray-600">First seen</p>
            <p className="text-sm font-semibold text-gray-900">1 Mar, 2025</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600">First purchase</p>
            <p className="text-sm font-semibold text-gray-900">4 Mar, 2025</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600">Revenue</p>
            <p className="text-sm font-semibold text-gray-900">$118.00</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600">MRR</p>
            <p className="text-sm font-semibold text-gray-900">$0.00</p>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="space-y-4">
          {/* 姓名 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900">Name</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="px-2 py-1.5 text-sm bg-gray-50 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sienna"
                disabled={!isEditing}
              />
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="px-2 py-1.5 text-sm bg-gray-50 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hewitt"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900">Email address</label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="py-1.5 pr-2 pl-8 w-full text-sm bg-gray-50 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="siennahewitt@gmail.com"
                disabled={!isEditing}
              />
            </div>
            <div className="flex gap-1 items-center mt-1">
              <div className="flex justify-center items-center w-3 h-3 bg-blue-500 rounded-full">
                <Check className="w-1.5 h-1.5 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600">VERIFIED 2 JAN, 2025</span>
            </div>
          </div>

          {/* 国家 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900">Country</label>
            <div className="relative">
              <div className="flex absolute left-2 top-1/2 gap-1 items-center -translate-y-1/2">
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <select
                value={editForm.country}
                onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                className="py-1.5 pr-6 pl-8 w-full text-sm bg-gray-50 rounded-md border border-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              >
                <option>United States</option>
                <option>China</option>
                <option>Canada</option>
                <option>United Kingdom</option>
              </select>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900">Username</label>
            <div className="flex">
              <div className="px-2 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-l-md border border-r-0 border-gray-200">
                untitledui.com/
              </div>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-50 rounded-r-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="siennahewitt"
                disabled={!isEditing}
              />
              <div className="p-1 ml-1 bg-blue-50 rounded-md border border-blue-200">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm text-gray-600 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800"
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  // 重置表单
                  setEditForm({
                    firstName: user?.name?.split(' ')[0] || '',
                    lastName: user?.name?.split(' ')[1] || '',
                    email: user?.email || '',
                    country: 'United States',
                    username: user?.username || user?.name?.toLowerCase().replace(' ', '') || ''
                  })
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Reset to default
              </button>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-600 rounded-md border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800"
                >
                  Edit Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 