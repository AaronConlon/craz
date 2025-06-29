import { useState, type FormEvent } from 'react'

import { useContainerRef } from '~source/shared/components/container-provider'
import { useUserProfile } from '~source/shared/hooks/use-user-profile'
import { celebrateSuccess } from '~source/shared/utils/confetti'
import { AuthContainer } from './auth-container'
import { UserProfileView } from './user-profile-view'

export function ProfileView() {
  const {
    user,
    isLoggedIn,
    login,
    register,
    logout,
  } = useUserProfile()

  const ref = useContainerRef()


  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authForm, setAuthForm] = useState<{
    email: string
    password: string
    name: string
  }>({
    email: 'rivenqinyy@gmail.com',
    password: 'password',
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
        celebrateSuccess(ref)
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
        celebrateSuccess(ref)
      }
    })
  }

  const handleLogout = () => {
    logout.mutate()
    setAuthForm({ email: '', password: '', name: '' })
  }


  if (!isLoggedIn) {
    return (
      <>
        <AuthContainer
          authForm={authForm}
          setAuthForm={setAuthForm}
          handleLoginSubmit={handleLoginSubmit}
          handleRegisterSubmit={handleRegisterSubmit}
          isLoginMode={isLoginMode}
          setIsLoginMode={setIsLoginMode}
          login={login}
          register={register}
        />
      </>
    )
  }

  return <UserProfileView user={user} onLogout={handleLogout} />
} 