import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import type { Env } from "../index"
import { createJwtMiddleware } from "../middleware/jwt"
import {
  LoginUserSchema,
  RegisterUserSchema,
  ResetPasswordSchema,
  UpdateUserSettingsSchema
} from "../schemas/user"
import { AuthService } from "../services/auth"

const authRoutes = new Hono<{ Bindings: Env }>()

// JWT认证中间件
const jwtAuth = createJwtMiddleware()

// 健康检查
authRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "认证服务运行中",
    timestamp: new Date().toISOString()
  })
})

// 用户注册
authRoutes.post(
  "/register",
  zValidator("json", RegisterUserSchema),
  async (c) => {
    const userData = c.req.valid("json")

    // 🐛 调试：打印服务端接收到的数据
    console.log("🔍 服务端注册调试:")
    console.log("  - 接收到的userData:", JSON.stringify(userData, null, 2))
    console.log("  - userData类型:", typeof userData)
    console.log("  - userData键值:", Object.keys(userData || {}))

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

    try {
      const result = await authService.register(userData)

      return c.json(
        {
          success: true,
          data: {
            user: result.user,
            token: result.token
          },
          message: "注册成功",
          timestamp: new Date().toISOString()
        },
        201
      )
    } catch (error) {
      console.error("用户注册失败:", error)

      if (error instanceof Error) {
        if (
          error.message.includes("用户名已存在") ||
          error.message.includes("邮箱已存在")
        ) {
          throw new HTTPException(409, { message: error.message })
        }
      }

      throw new HTTPException(500, { message: "注册失败" })
    }
  }
)

// 用户登录
authRoutes.post("/login", zValidator("json", LoginUserSchema), async (c) => {
  const credentials = c.req.valid("json")
  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

  try {
    const result = await authService.login(credentials)

    return c.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: "登录成功",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("用户登录失败:", error)

    if (error instanceof Error && error.message.includes("邮箱或密码错误")) {
      throw new HTTPException(401, { message: "邮箱或密码错误" })
    }

    throw new HTTPException(500, { message: "登录失败" })
  }
})

// 获取当前用户信息
authRoutes.get("/me", jwtAuth, async (c) => {
  const userPayload = c.get("user")
  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

  try {
    const user = await authService.getUserById(userPayload.userId)

    if (!user) {
      throw new HTTPException(404, { message: "用户不存在" })
    }

    return c.json({
      success: true,
      data: {
        user
      },
      message: "获取用户信息成功",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("获取用户信息失败:", error)
    throw new HTTPException(500, { message: "获取用户信息失败" })
  }
})

// 更新用户设置
authRoutes.put(
  "/settings",
  jwtAuth,
  zValidator("json", UpdateUserSettingsSchema),
  async (c) => {
    const userPayload = c.get("user")
    const settingsData = c.req.valid("json")
    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

    try {
      const updatedUser = await authService.updateUserSettings(
        userPayload.userId,
        settingsData
      )

      return c.json({
        success: true,
        data: updatedUser,
        message: "设置更新成功",
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("更新用户设置失败:", error)

      if (error instanceof Error && error.message.includes("用户不存在")) {
        throw new HTTPException(404, { message: "用户不存在" })
      }

      throw new HTTPException(500, { message: "设置更新失败" })
    }
  }
)

// 检查用户名是否可用
authRoutes.get("/check-username", async (c) => {
  const username = c.req.query("username")

  if (!username) {
    throw new HTTPException(400, { message: "用户名参数是必需的" })
  }

  // 验证用户名格式
  if (
    username.length < 3 ||
    username.length > 20 ||
    !/^[a-zA-Z0-9_]+$/.test(username)
  ) {
    throw new HTTPException(400, { message: "用户名格式不正确" })
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

  try {
    const exists = await authService.checkUsernameExists(username)

    return c.json({
      success: true,
      data: {
        username,
        available: !exists
      },
      message: "用户名可用性检查完成",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("检查用户名失败:", error)
    throw new HTTPException(500, { message: "检查用户名失败" })
  }
})

// 检查邮箱是否可用
authRoutes.get("/check-email", async (c) => {
  const email = c.req.query("email")

  if (!email) {
    throw new HTTPException(400, { message: "邮箱参数是必需的" })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new HTTPException(400, { message: "邮箱格式不正确" })
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

  try {
    const exists = await authService.checkEmailExists(email)

    return c.json({
      success: true,
      data: {
        email,
        available: !exists
      },
      message: "邮箱可用性检查完成",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("检查邮箱失败:", error)
    throw new HTTPException(500, { message: "检查邮箱失败" })
  }
})

// 刷新令牌 - 使用新的 JWT 服务
authRoutes.post("/refresh", jwtAuth, async (c) => {
  const authHeader = c.req.header("Authorization")
  const oldToken = authHeader?.substring(7) // 移除 "Bearer " 前缀

  if (!oldToken) {
    throw new HTTPException(401, { message: "请提供有效的认证令牌" })
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

  try {
    const newToken = await authService.refreshJWT(oldToken)

    if (!newToken) {
      throw new HTTPException(401, { message: "令牌刷新失败" })
    }

    const userPayload = c.get("user")
    const user = await authService.getUserById(userPayload.userId)

    if (!user) {
      throw new HTTPException(404, { message: "用户不存在" })
    }

    return c.json({
      success: true,
      data: {
        user,
        token: newToken
      },
      message: "令牌刷新成功",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("刷新令牌失败:", error)
    throw new HTTPException(500, { message: "刷新令牌失败" })
  }
})

// 重置密码
authRoutes.post(
  "/reset-password",
  zValidator("json", ResetPasswordSchema),
  async (c) => {
    const payload = c.req.valid("json")
    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET)

    try {
      const result = await authService.resetUserPassword(payload)

      return c.json({
        success: true,
        data: result,
        message: "密码重置成功",
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("重置密码失败:", error)
      throw new HTTPException(500, { message: "重置密码失败" })
    }
  }
)

// 导出JWT认证中间件供其他路由使用
export { jwtAuth }
export { authRoutes }
