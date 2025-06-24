import type { D1Database } from "@cloudflare/workers-types"
import { decode, sign, verify } from "hono/jwt"

import type {
  JwtPayload,
  LoginUser,
  RegisterUser,
  ResetPassword,
  UserResponse,
  UserSettings
} from "../schemas/user"
import { DatabaseService, type DatabaseUser } from "./database"

export class AuthService extends DatabaseService {
  private jwtSecret: string
  private jwtAlgorithm: "HS256" | "HS384" | "HS512" = "HS256"

  constructor(db: D1Database, jwtSecret: string) {
    super(db)
    this.jwtSecret = jwtSecret
  }

  // 密码哈希
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + "craz_salt_2024") // 添加盐值
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  // 验证密码
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }

  // 生成JWT - 使用 Hono JWT helper 的最佳实践
  private async generateJWT(user: DatabaseUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isSponsored: Boolean(user.is_sponsored),
      iat: now, // 签发时间
      exp: now + 7 * 24 * 60 * 60, // 7天过期
      nbf: now // 生效时间
    }

    try {
      return await sign(payload, this.jwtSecret, this.jwtAlgorithm)
    } catch (error) {
      console.error("JWT 签名失败:", error)
      throw new Error("令牌生成失败")
    }
  }

  // 验证JWT - 使用 Hono JWT helper 的验证功能
  async verifyJWT(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await verify(token, this.jwtSecret, this.jwtAlgorithm)
      return payload as JwtPayload
    } catch (error) {
      console.error("JWT 验证失败:", error)
      return null
    }
  }

  // 解码JWT（不验证签名） - 用于调试和检查令牌内容
  decodeJWT(token: string): { header: any; payload: JwtPayload } | null {
    try {
      const { header, payload } = decode(token)
      return { header, payload: payload as JwtPayload }
    } catch (error) {
      console.error("JWT 解码失败:", error)
      return null
    }
  }

  // 刷新JWT令牌
  async refreshJWT(oldToken: string): Promise<string | null> {
    try {
      // 先验证旧令牌
      const payload = await this.verifyJWT(oldToken)
      if (!payload) {
        return null
      }

      // 获取用户信息
      const dbUser = await this.queryFirst<DatabaseUser>(
        "SELECT * FROM users WHERE id = ? LIMIT 1",
        [payload.userId]
      )

      if (!dbUser) {
        return null
      }

      // 生成新令牌
      return await this.generateJWT(dbUser)
    } catch (error) {
      console.error("JWT 刷新失败:", error)
      return null
    }
  }

  // 检查用户名是否存在
  async checkUsernameExists(username: string): Promise<boolean> {
    const user = await this.queryFirst<{ id: string }>(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    )
    return !!user
  }

  // 检查邮箱是否存在
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.queryFirst<{ id: string }>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    )
    return !!user
  }

  // 用户注册
  async register(
    userData: RegisterUser
  ): Promise<{ user: UserResponse; token: string }> {
    // 检查用户名和邮箱是否已存在
    const [usernameExists, emailExists] = await Promise.all([
      this.checkUsernameExists(userData.username),
      this.checkEmailExists(userData.email)
    ])

    if (usernameExists) {
      throw new Error("用户名已存在")
    }

    if (emailExists) {
      throw new Error("邮箱已存在")
    }

    // 创建用户
    const userId = this.generateId()
    const passwordHash = await this.hashPassword(userData.password)
    const timestamp = this.getCurrentTimestamp()

    // 默认用户设置
    const defaultSettings: UserSettings = {
      theme: "blue",
      language: "zh-CN",
      fontSize: "medium"
    }

    await this.execute(
      `INSERT INTO users (
        id, username, email, password_hash, is_sponsored, 
        receive_official_messages, settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userData.username,
        userData.email,
        passwordHash,
        0, // 默认非赞助者
        userData.receiveOfficialMessages ? 1 : 0,
        JSON.stringify(defaultSettings),
        timestamp,
        timestamp
      ]
    )

    // 获取创建的用户信息
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error("用户创建失败")
    }

    // 生成JWT
    const dbUser: DatabaseUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: passwordHash,
      is_sponsored: user.isSponsored ? 1 : 0,
      receive_official_messages: user.receiveOfficialMessages ? 1 : 0,
      settings: JSON.stringify(user.settings),
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }

    const token = await this.generateJWT(dbUser)

    return { user, token }
  }

  // 用户登录
  async login(
    credentials: LoginUser
  ): Promise<{ user: UserResponse; token: string }> {
    // 查找用户
    const dbUser = await this.queryFirst<DatabaseUser>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [credentials.email]
    )

    if (!dbUser) {
      throw new Error("邮箱或密码错误")
    }

    // 验证密码
    const isValidPassword = await this.verifyPassword(
      credentials.password,
      dbUser.password_hash
    )
    if (!isValidPassword) {
      throw new Error("邮箱或密码错误")
    }

    // 转换为响应格式
    const user = this.formatUserResponse(dbUser)

    // 生成JWT
    const token = await this.generateJWT(dbUser)

    return { user, token }
  }

  // 根据ID获取用户
  async getUserById(userId: string): Promise<UserResponse | null> {
    const dbUser = await this.queryFirst<DatabaseUser>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    )

    if (!dbUser) {
      return null
    }

    return this.formatUserResponse(dbUser)
  }

  // 根据邮箱获取用户
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const dbUser = await this.queryFirst<DatabaseUser>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    )

    if (!dbUser) {
      return null
    }

    return this.formatUserResponse(dbUser)
  }

  // 更新用户设置
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings> & { receiveOfficialMessages?: boolean }
  ): Promise<UserResponse> {
    // 获取当前用户
    const currentUser = await this.getUserById(userId)
    if (!currentUser) {
      throw new Error("用户不存在")
    }

    // 分离用户级别的设置和UI设置
    const { receiveOfficialMessages, ...uiSettings } = settings

    // 合并UI设置
    const updatedSettings: UserSettings = {
      ...currentUser.settings,
      ...uiSettings
    }

    const timestamp = this.getCurrentTimestamp()

    // 构建更新查询
    let updateQuery = "UPDATE users SET settings = ?, updated_at = ?"
    let updateParams = [JSON.stringify(updatedSettings), timestamp]

    // 如果包含receiveOfficialMessages，也更新这个字段
    if (receiveOfficialMessages !== undefined) {
      updateQuery += ", receive_official_messages = ?"
      updateParams.push(receiveOfficialMessages ? "1" : "0")
    }

    updateQuery += " WHERE id = ?"
    updateParams.push(userId)

    // 更新数据库
    await this.execute(updateQuery, updateParams)

    // 返回更新后的用户信息
    const updatedUser = await this.getUserById(userId)
    if (!updatedUser) {
      throw new Error("用户设置更新失败")
    }

    return updatedUser
  }

  async resetUserPassword(payload: ResetPassword) {
    const { email, password } = payload

    const dbUser = await this.queryFirst<DatabaseUser>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    )

    if (!dbUser) {
      throw new Error("用户不存在")
    }

    const passwordHash = await this.hashPassword(password)
    await this.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      dbUser.id
    ])

    return {
      success: true,
      message: "密码重置成功"
    }
  }

  // 格式化用户响应（移除敏感信息）
  private formatUserResponse(dbUser: DatabaseUser): UserResponse {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      isSponsored: Boolean(dbUser.is_sponsored),
      receiveOfficialMessages: Boolean(dbUser.receive_official_messages),
      settings: JSON.parse(dbUser.settings) as UserSettings,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    }
  }
}
