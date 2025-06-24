import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";



import { userProfileAction } from "../api/messages";
import type { AuthResponse, AuthUser } from "../api/types";
import type { AuthStatus, UserSettings } from "../types/settings";
import { getDefaultSettings } from "../types/settings";


// 用户配置文件类型
export interface UserProfile {
  user: AuthUser | null
  settings: UserSettings
  authStatus: AuthStatus
  lastSyncAt: number
}

/**
 * 用户配置文件查询钩子
 */
export function useUserProfile() {
  const queryClient = useQueryClient()

  // 获取用户配置文件
  const query = useQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfile> => {
      const response = await userProfileAction({
        action: "getUserProfile"
      })
      console.log("getUserProfile response:", response)

      if (!response.success) {
        throw new Error(response.error || "获取用户配置文件失败")
      }

      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 30 * 60 * 1000, // 30分钟垃圾回收
    refetchOnWindowFocus: false
  })

  // 更新用户设置
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const response = await userProfileAction({
        action: "updateUserSettings",
        data: newSettings
      })

      if (!response.success) {
        throw new Error(response.error || "更新设置失败")
      }

      return response.data
    },
    onSuccess: (updatedSettings) => {
      console.log("updatedSettings:", updatedSettings)

      // 更新缓存中的设置
      queryClient.setQueryData(["userProfile"], (oldData: UserProfile) => ({
        ...oldData,
        settings: updatedSettings,
        lastSyncAt: Date.now()
      }))
    },
    onError: (error: Error) => {
      console.error("Failed to update settings:", error)
      toast.error(error.message || "暂时无法保存设置")
    }
  })

  // 登录
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await userProfileAction({
        action: "login",
        data: credentials
      })

      if (!response.success) {
        throw new Error(response.error || "登录失败")
      }
      console.log("login response:", response)

      return response.data
    },
    onSuccess: () => {
      // 登录成功后刷新用户配置文件
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("登录成功")
    },
    onError: (error: Error) => {
      console.error("Login failed:", error)
      toast.error(error.message || "登录失败")
    }
  })

  // 注册
  const register = useMutation({
    mutationFn: async (userData: {
      email: string
      password: string
      username: string
    }) => {
      const response = await userProfileAction({
        action: "register",
        data: userData
      })

      console.log("register response:", response)

      if (!response.success) {
        throw new Error(response.error || "注册失败")
      }

      return response.data
    },
    onSuccess: (response) => {
      // 注册成功后刷新用户配置文件
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("注册成功")
      // 更新用户 profile 信息
      queryClient.setQueryData(["userProfile"], (oldData: UserProfile) => ({
        ...oldData,
        user: response.data.user
      }))
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error)
      toast.error(error.message || "注册失败")
    }
  })

  // 登出
  const logout = useMutation({
    mutationFn: async () => {
      const response = await userProfileAction({
        action: "logout"
      })

      if (!response.success) {
        throw new Error(response.error || "登出失败")
      }

      return response.data
    },
    onSuccess: () => {
      // 登出成功后刷新用户配置文件
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("已安全登出")
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error)
      toast.error(error.message || "登出失败")
    }
  })

  // 强制同步配置文件
  const syncProfile = useMutation({
    mutationFn: async () => {
      const response = await userProfileAction({
        action: "syncProfile"
      })

      if (!response.success) {
        throw new Error(response.error || "同步失败")
      }

      return response.data
    },
    onSuccess: (freshProfile) => {
      queryClient.setQueryData(["userProfile"], freshProfile)
      toast.success("同步完成")
    },
    onError: (error: Error) => {
      console.error("Sync failed:", error)
      toast.error(error.message || "同步失败")
    }
  })

  return {
    // 数据
    profile: query.data,
    user: query.data?.user,
    settings: query.data?.settings || getDefaultSettings(),
    authStatus: query.data?.authStatus || { isLoggedIn: false },
    isLoggedIn: query.data?.authStatus?.isLoggedIn || false,

    // 状态
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // 操作
    updateSettings,
    login,
    register,
    logout,
    syncProfile,
    refetch: query.refetch
  }
}

/**
 * 简化的用户设置钩子
 */
export function useUserSettings() {
  const { settings, updateSettings, isLoading } = useUserProfile()
  return {
    settings,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
    isLoading
  }
}

/**
 * 简化的认证状态钩子
 */
export function useAuthStatus() {
  const { authStatus, user, isLoggedIn, login, register, logout, isLoading } =
    useUserProfile()

  return {
    authStatus,
    user,
    isLoggedIn,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
    isLoading,
    isLoggingIn: login.isPending,
    isRegistering: register.isPending,
    isLoggingOut: logout.isPending
  }
}