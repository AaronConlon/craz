import { beforeEach, describe, expect, test } from "vitest"

import {
  AuthSuccessResponseSchema,
  AvailabilityResponseSchema,
  HealthResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  SettingsUpdateResponseSchema,
  UserProfileResponseSchema
} from "../schemas/api-responses"
import { AuthApiClient, ResponseValidator } from "../utils/api-client"

describe("认证接口测试", () => {
  const client = new AuthApiClient()

  // 测试数据
  const generateTestUser = () => {
    const timestamp = Date.now().toString().slice(-8) // 只取最后8位数字
    const randomStr = Math.random().toString(36).substr(2, 4) // 4位随机字符
    const user = {
      username: `test_${timestamp.slice(-6)}_${randomStr}`, // 确保不超过20字符: test_529123_abc1 = 17字符
      email: `test_${timestamp}_${randomStr}@example.com`,
      password: "password123",
      receiveOfficialMessages: true
    }
    if (RegisterRequestSchema.safeParse(user).success) {
      return user
    }
    throw new Error("Invalid user data")
  }

  const invalidUser = {
    username: "ab", // 太短
    email: "invalid-email", // 无效邮箱
    password: "123" // 太短
  }

  describe("健康检查", () => {
    test("认证服务健康检查", async () => {
      const response = await client.health()

      const data = await ResponseValidator.validate(
        response,
        200,
        HealthResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.message).toContain("认证服务运行中")
      expect(data.timestamp).toBeDefined()
    })
  })

  describe("用户注册", () => {
    test("成功注册新用户", async () => {
      const testUser = generateTestUser()

      // 验证请求数据格式
      const validatedRequest = RegisterRequestSchema.parse(testUser)
      expect(validatedRequest).toBeDefined()

      const response = await client.register(testUser)

      const data = await ResponseValidator.validate(
        response,
        201,
        AuthSuccessResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.message).toContain("注册成功")
      expect(data.data.user).toBeDefined()
      expect(data.data.token).toBeDefined()

      // 验证用户信息结构
      const user = data.data.user
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ) // UUID
      expect(user.email).toBe(testUser.email)
      expect(user.username).toBe(testUser.username)
      expect(user.isSponsored).toBe(false)

      // 验证默认设置
      expect(user.settings.theme).toBe("blue")
      expect(user.settings.language).toBe("zh-CN")
      expect(user.settings.fontSize).toBe("medium")
      expect(user.receiveOfficialMessages).toBe(true)

      // 验证 JWT 令牌格式
      expect(data.data.token).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
      )
    })

    test("拒绝无效的用户数据", async () => {
      const response = await client.register(invalidUser)

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝重复的用户名", async () => {
      const testUser = generateTestUser()

      // 第一次注册应该成功
      const firstResponse = await client.register(testUser)
      await ResponseValidator.validate(
        firstResponse,
        201,
        AuthSuccessResponseSchema
      )

      // 第二次使用相同用户名应该失败
      const duplicateUser = {
        ...generateTestUser(),
        username: testUser.username // 相同用户名
      }

      const secondResponse = await client.register(duplicateUser)
      await ResponseValidator.validateError(secondResponse, 409, "用户名已存在")
    })

    test("拒绝重复的邮箱", async () => {
      const testUser = generateTestUser()

      // 第一次注册应该成功
      const firstResponse = await client.register(testUser)
      await ResponseValidator.validate(
        firstResponse,
        201,
        AuthSuccessResponseSchema
      )

      // 第二次使用相同邮箱应该失败
      const duplicateUser = {
        ...generateTestUser(),
        email: testUser.email // 相同邮箱
      }

      const secondResponse = await client.register(duplicateUser)
      await ResponseValidator.validateError(secondResponse, 409, "邮箱已存在")
    })
  })

  describe("用户登录", () => {
    let registeredUser: any
    let userCredentials: any

    beforeEach(async () => {
      // 注册一个测试用户
      userCredentials = generateTestUser()
      const registerResponse = await client.register(userCredentials)
      const registerData = await ResponseValidator.validate(
        registerResponse,
        201,
        AuthSuccessResponseSchema
      )
      registeredUser = registerData.data.user
    })

    test("成功登录", async () => {
      const loginData = {
        email: userCredentials.email,
        password: userCredentials.password
      }

      // 验证登录请求数据格式
      const validatedLogin = LoginRequestSchema.parse(loginData)
      expect(validatedLogin).toBeDefined()

      const response = await client.login(loginData)

      const data = await ResponseValidator.validate(
        response,
        200,
        AuthSuccessResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.message).toContain("登录成功")
      expect(data.data.user).toBeDefined()
      expect(data.data.token).toBeDefined()

      // 验证返回的用户信息
      const user = data.data.user
      expect(user.id).toBe(registeredUser.id)
      expect(user.email).toBe(userCredentials.email)
      expect(user.username).toBe(userCredentials.username)
    })

    test("拒绝错误的邮箱", async () => {
      const response = await client.login({
        email: "nonexistent@example.com",
        password: userCredentials.password
      })

      await ResponseValidator.validateError(response, 401, "邮箱或密码错误")
    })

    test("拒绝错误的密码", async () => {
      const response = await client.login({
        email: userCredentials.email,
        password: "wrongpassword"
      })

      await ResponseValidator.validateError(response, 401, "邮箱或密码错误")
    })

    test("拒绝无效的登录数据", async () => {
      const response = await client.login({
        email: "invalid-email",
        password: ""
      })

      await ResponseValidator.validateError(response, 400)
    })
  })

  describe("用户认证", () => {
    let userToken: string
    let userData: any

    beforeEach(async () => {
      // 注册并登录获取令牌
      const testUser = generateTestUser()
      const registerResponse = await client.register(testUser)
      const registerData = await ResponseValidator.validate(
        registerResponse,
        201,
        AuthSuccessResponseSchema
      )
      userToken = registerData.data.token
      userData = registerData.data.user
    })

    test("使用有效令牌获取用户信息", async () => {
      const response = await client.me(userToken)

      const data = await ResponseValidator.validate(
        response,
        200,
        UserProfileResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.user.id).toBe(userData.id)
      expect(data.data.user.email).toBe(userData.email)
      expect(data.data.user.username).toBe(userData.username)
    })

    test("拒绝无效令牌", async () => {
      const response = await client.me("invalid-token")

      await ResponseValidator.validateError(response, 401, "token")
    })

    test("拒绝缺失令牌", async () => {
      const response = await client.me("")

      await ResponseValidator.validateError(response, 401)
    })

    test("更新用户设置", async () => {
      const newSettings = {
        theme: "green",
        language: "en",
        fontSize: "large",
        receiveOfficialMessages: false
      }

      const response = await client.updateSettings(userToken, newSettings)

      const data = await ResponseValidator.validate(
        response,
        200,
        SettingsUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.settings.theme).toBe("green")
      expect(data.data.settings.language).toBe("en")
      expect(data.data.settings.fontSize).toBe("large")
      expect(data.data.receiveOfficialMessages).toBe(false)
    })

    test("拒绝无效的设置值", async () => {
      const invalidSettings = {
        theme: "invalid-theme",
        language: "invalid-language",
        fontSize: "invalid-size"
      }

      const response = await client.updateSettings(userToken, invalidSettings)

      await ResponseValidator.validateError(response, 400)
    })
  })

  describe("可用性检查", () => {
    let existingUser: any

    beforeEach(async () => {
      // 注册一个用户以供检查
      const testUser = generateTestUser()
      const registerResponse = await client.register(testUser)
      const registerData = await ResponseValidator.validate(
        registerResponse,
        201,
        AuthSuccessResponseSchema
      )
      existingUser = {
        username: testUser.username,
        email: testUser.email
      }
    })

    test("检查可用的用户名", async () => {
      const newUsername = `avail${Date.now().toString().slice(-8)}`
      const response = await client.checkUsernameAvailability(newUsername)

      const data = await ResponseValidator.validate(
        response,
        200,
        AvailabilityResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.available).toBe(true)
    })

    test("检查已存在的用户名", async () => {
      const response = await client.checkUsernameAvailability(
        existingUser.username
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        AvailabilityResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.available).toBe(false)
    })

    test("检查可用的邮箱", async () => {
      const newEmail = `avail${Date.now().toString().slice(-8)}@example.com`
      const response = await client.checkEmailAvailability(newEmail)

      const data = await ResponseValidator.validate(
        response,
        200,
        AvailabilityResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.available).toBe(true)
    })

    test("检查已存在的邮箱", async () => {
      const response = await client.checkEmailAvailability(existingUser.email)

      const data = await ResponseValidator.validate(
        response,
        200,
        AvailabilityResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.available).toBe(false)
    })

    test("拒绝无效的用户名格式", async () => {
      const response = await client.checkUsernameAvailability("ab") // 太短

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝无效的邮箱格式", async () => {
      const response = await client.checkEmailAvailability("invalid-email")

      await ResponseValidator.validateError(response, 400)
    })
  })
})
