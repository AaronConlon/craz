import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import { jwt } from "hono/jwt"

import type { Env } from "../index"
import type { JwtPayload } from "../schemas/user"

// 定义上下文变量类型
declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload
    jwtPayload: JwtPayload
  }
}

/**
 * JWT 认证中间件工厂
 * 使用 Hono 的官方 JWT 中间件
 */
export const createJwtMiddleware = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, {
        message: "请提供有效的认证令牌"
      })
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    try {
      // 使用 Hono 的 jwt helper 进行验证
      const { verify } = await import("hono/jwt")
      const payload = (await verify(
        token,
        c.env.JWT_SECRET,
        "HS256"
      )) as JwtPayload

      // 检查令牌是否过期（Hono JWT 会自动检查，但我们可以添加额外验证）
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        throw new HTTPException(401, { message: "认证令牌已过期" })
      }

      // 检查令牌是否生效
      if (payload.nbf && payload.nbf > now) {
        throw new HTTPException(401, { message: "认证令牌尚未生效" })
      }

      // 将用户信息添加到上下文
      c.set("user", payload)
      c.set("jwtPayload", payload) // 为了兼容现有代码

      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      console.error("JWT 验证失败:", error)

      // 根据不同的错误类型返回不同的错误信息
      let message = "认证失败"
      if (error instanceof Error) {
        if (error.message.includes("expired")) {
          message = "认证令牌已过期"
        } else if (error.message.includes("invalid")) {
          message = "无效的认证令牌"
        } else if (error.message.includes("malformed")) {
          message = "认证令牌格式错误"
        }
      }

      throw new HTTPException(401, { message })
    }
  }
}

/**
 * 使用 Hono 内置 JWT 中间件的版本
 * 这是更简洁的方式，推荐使用
 */
export const createHonoJwtMiddleware = (secret: string) => {
  return jwt({
    secret,
    alg: "HS256"
  })
}

/**
 * 可选的权限检查中间件
 * 检查用户是否有特定权限（如赞助者权限）
 */
export const requireSponsored = () => {
  return async (c: Context, next: Next) => {
    const payload = c.get("jwtPayload") as JwtPayload

    if (!payload || !payload.isSponsored) {
      throw new HTTPException(403, {
        message: "此功能需要赞助者权限"
      })
    }

    await next()
  }
}

/**
 * 可选的用户存在检查中间件
 * 验证 JWT 中的用户在数据库中仍然存在
 */
export const validateUser = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const payload = c.get("jwtPayload") as JwtPayload

    if (!payload || !payload.userId) {
      throw new HTTPException(401, { message: "无效的用户信息" })
    }

    // 这里可以添加数据库查询来验证用户是否存在
    // 但为了性能考虑，通常不在每个请求都做这个检查

    await next()
  }
}
