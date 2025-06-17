import { afterAll, beforeAll, describe, expect, test } from "vitest"

import { MainApiClient } from "../utils/api-client"

describe("History API 基础集成测试", () => {
  const client = new MainApiClient()
  let authToken: string
  let testUserId: string
  let createdHistoryItems: string[] = []

  beforeAll(async () => {
    // 创建测试用户并获取认证令牌
    const timestamp = Date.now().toString().slice(-8) // 只取后8位
    const userData = {
      username: `hist_${timestamp}`,
      email: `hist_${timestamp}@example.com`,
      password: "testpassword123",
      receiveOfficialMessages: false
    }

    const registerResponse = await client.auth.register(userData)
    expect(registerResponse.status).toBe(201)

    const registerData = await registerResponse.json()
    authToken = registerData.data.token
    testUserId = registerData.data.user.id

    console.log(`✅ 测试用户创建成功: ${userData.username}`)
  })

  afterAll(async () => {
    // 清理测试数据
    if (createdHistoryItems.length > 0) {
      try {
        await client.history.batchDeleteHistory(authToken, {
          ids: createdHistoryItems
        })
        console.log(`🧹 清理了 ${createdHistoryItems.length} 条测试历史记录`)
      } catch (error) {
        console.warn("清理测试数据时出错:", error)
      }
    }
  })

  describe("健康检查", () => {
    test("历史记录服务健康检查", async () => {
      const response = await client.history.health()
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("历史记录服务运行中")
      expect(data.timestamp).toBeDefined()
    })
  })

  describe("基础 CRUD 操作", () => {
    test("创建历史记录", async () => {
      const historyData = {
        url: "https://example.com",
        title: "Example Website",
        visitCount: 1,
        typedCount: 0
      }

      const response = await client.history.createHistoryItem(
        authToken,
        historyData
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("创建历史记录成功")
      expect(data.data).toMatchObject({
        url: historyData.url,
        title: historyData.title,
        visitCount: historyData.visitCount,
        typedCount: historyData.typedCount,
        userId: testUserId
      })
      expect(data.data.id).toBeDefined()

      // 保存ID用于后续测试和清理
      createdHistoryItems.push(data.data.id)
    })

    test("获取历史记录列表", async () => {
      const response = await client.history.getHistory(authToken, {
        page: 1,
        pageSize: 10
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("获取历史记录列表成功")
      expect(data.data.items).toBeInstanceOf(Array)
      expect(data.data.pagination).toMatchObject({
        total: expect.any(Number),
        page: 1,
        pageSize: 10,
        hasNextPage: expect.any(Boolean)
      })
    })

    test("获取单个历史记录", async () => {
      const historyId = createdHistoryItems[0]
      const response = await client.history.getHistoryItem(authToken, historyId)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("获取历史记录成功")
      expect(data.data.id).toBe(historyId)
    })
  })

  describe("错误处理", () => {
    test("未认证访问", async () => {
      const response = await client.history.getHistory("invalid_token")

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain("认证")
    })

    test("访问不存在的历史记录", async () => {
      const response = await client.history.getHistoryItem(
        authToken,
        "nonexistent-id"
      )

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain("历史记录不存在")
    })
  })
})
