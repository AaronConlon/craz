import { BaseApiClient } from "./base-client"
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest
} from "./types"

export class AuthApi extends BaseApiClient {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>(
      "api/auth/login",
      credentials
    )

    // 登录成功后自动设置 token
    if (response.success && response.token) {
      this.setToken(response.token)
    }

    return response
  }

  /**
   * 用户注册
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>(
      "api/auth/register",
      userData
    )

    // 注册成功后自动设置 token
    if (response.success && response.token) {
      this.setToken(response.token)
    }

    return response
  }

  /**
   * 用户登出
   */
  async logout(): Promise<{ success: boolean }> {
    const response = await this.post<{ success: boolean }>("api/auth/logout")

    // 登出后清除 token
    if (response.success) {
      this.removeToken()
    }

    return response
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<AuthResponse> {
    return await this.get<AuthResponse>("api/auth/me")
  }

  /**
   * 刷新 token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("api/auth/refresh")

    // 刷新成功后更新 token
    if (response.success && response.token) {
      this.setToken(response.token)
    }

    return response
  }

  /**
   * 检查认证状态
   */
  async checkAuthStatus(): Promise<{
    authenticated: boolean
    user?: AuthUser
  }> {
    try {
      const response = await this.getCurrentUser()
      return {
        authenticated: response.success,
        user: response.user
      }
    } catch (error) {
      return { authenticated: false }
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userData: Partial<AuthUser>): Promise<AuthResponse> {
    return await this.put<AuthResponse>("api/auth/profile", userData)
  }

  /**
   * 修改密码
   */
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<{ success: boolean; error?: string }> {
    return await this.put<{ success: boolean; error?: string }>(
      "api/auth/password",
      data
    )
  }

  /**
   * 请求密码重置
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    return await this.post<{ success: boolean; error?: string }>(
      "api/auth/forgot-password",
      { email }
    )
  }

  /**
   * 重置密码
   */
  async resetPassword(data: {
    token: string
    newPassword: string
  }): Promise<{ success: boolean; error?: string }> {
    return await this.post<{ success: boolean; error?: string }>(
      "api/auth/reset-password",
      data
    )
  }
}
