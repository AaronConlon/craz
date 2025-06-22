import { useState, type FormEvent } from 'react'

import { useUserProfile } from '~source/shared/hooks/use-user-profile'
import { celebrateSuccess } from '~source/shared/utils/confetti'
import { LoginView } from './login-view'
import { RegisterView } from './register-view'
import { UserProfileView } from './user-profile-view'

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

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({
      email: authForm.email,
      password: authForm.password
    }, {
      onSuccess: () => {
        // 登录成功后撒花庆祝
        celebrateSuccess()
      }
    })
  }

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault()
    register.mutate({
      email: authForm.email,
      password: authForm.password,
      username: authForm.name
    }, {
      onSuccess: () => {
        // 注册成功后撒花庆祝
        celebrateSuccess()
      }
    })
  }

  const handleLogout = () => {
    logout.mutate()
    setAuthForm({ email: '', password: '', name: '' })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-900">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 animate-spin dark:border-blue-400 border-t-transparent" />
      </div>
    )
  }

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return (
        <LoginView
          authForm={authForm}
          setAuthForm={setAuthForm}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={handleLoginSubmit}
          isLoading={login.isPending}
          onSwitchToRegister={() => setAuthMode('register')}
        />
      )
    } else {
      return (
        <RegisterView
          authForm={authForm}
          setAuthForm={setAuthForm}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={handleRegisterSubmit}
          isLoading={register.isPending}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      )
    }
  }

  return <UserProfileView user={user} onLogout={handleLogout} />
} 