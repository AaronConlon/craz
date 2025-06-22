import { useState, type FormEvent } from 'react'
import { LoginView } from './login-view'
import { RegisterView } from './register-view'

interface AuthForm {
  name: string
  email: string
  password: string
}

interface AuthContainerProps {
  authForm: AuthForm
  setAuthForm: React.Dispatch<React.SetStateAction<AuthForm>>
  handleLoginSubmit: (e: FormEvent) => void
  handleRegisterSubmit: (e: FormEvent) => void
  isLoginMode: boolean
  setIsLoginMode: (isLogin: boolean) => void
  login: any
  register: any
}

export function AuthContainer({
  authForm,
  setAuthForm,
  handleLoginSubmit,
  handleRegisterSubmit,
  isLoginMode,
  setIsLoginMode,
  login,
  register
}: AuthContainerProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative w-full max-w-[800px] mx-auto overflow-hidden">
      {/* 动画容器 - 左右排列 */}
      <div className="relative h-auto min-h-[500px] w-[400px]">
        {/* 登录组件 */}
        <div
          className="absolute top-0 w-[400px] h-full transition-all duration-500 ease-out"
          style={{
            left: isLoginMode ? '0px' : '-400px'
          }}
        >
          <LoginView
            authForm={authForm}
            setAuthForm={setAuthForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSubmit={handleLoginSubmit}
            isLoading={login.isPending}
            onSwitchToRegister={() => setIsLoginMode(false)}
          />
        </div>

        {/* 注册组件 */}
        <div
          className="absolute top-0 w-[400px] h-full transition-all duration-500 ease-out"
          style={{
            left: !isLoginMode ? '0px' : '400px'
          }}
        >
          <RegisterView
            authForm={authForm}
            setAuthForm={setAuthForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSubmit={handleRegisterSubmit}
            isLoading={register.isPending}
            onSwitchToLogin={() => setIsLoginMode(true)}
          />
        </div>
      </div>
    </div>
  )
} 