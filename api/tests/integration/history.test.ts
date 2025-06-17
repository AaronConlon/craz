import { afterAll, beforeAll, describe, expect, test } from "vitest"

import { MainApiClient, ResponseValidator } from "../utils/api-client"

describe("History API 集成测试", () => {
  const client = new MainApiClient()
  let authToken: string
  let testUserId: string
  let createdHistoryItems: string[] = []

  // 测试数据
  const testHistoryItems = [
    {
      url: "https://example.com",
      title: "Example Website",
      visitCount: 1,
      typedCount: 0
    },
    {
      url: "https://github.com",
      title: "GitHub",
      visitCount: 5,
      typedCount: 2
    },
    {
      url: "https://stackoverflow.com/questions/test",
      title: "Stack Overflow - Test Question",
      visitCount: 3,
      typedCount: 0
    }
  ]

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

  describe("CRUD 操作", () => {
    test("创建历史记录", async () => {
      const historyData = testHistoryItems[0]
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
      expect(data.data.visitTime).toBeDefined()
      expect(data.data.lastVisitTime).toBeDefined()
      expect(data.data.createdAt).toBeDefined()
      expect(data.data.updatedAt).toBeDefined()

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

      // 验证返回的历史记录包含我们创建的记录
      const foundItem = data.data.items.find(
        (item: any) => item.url === testHistoryItems[0].url
      )
      expect(foundItem).toBeDefined()
    })

    test("获取单个历史记录", async () => {
      const historyId = createdHistoryItems[0]
      const response = await client.history.getHistoryItem(authToken, historyId)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("获取历史记录成功")
      expect(data.data).toMatchObject({
        id: historyId,
        url: testHistoryItems[0].url,
        title: testHistoryItems[0].title,
        userId: testUserId
      })
    })

    test("更新历史记录", async () => {
      const historyId = createdHistoryItems[0]
      const updateData = {
        title: "Updated Example Website",
        visitCount: 10,
        typedCount: 5
      }

      const response = await client.history.updateHistoryItem(
        authToken,
        historyId,
        updateData
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("更新历史记录成功")
      expect(data.data).toMatchObject({
        id: historyId,
        title: updateData.title,
        visitCount: updateData.visitCount,
        typedCount: updateData.typedCount
      })
    })

    test("删除历史记录", async () => {
      // 先创建一个临时记录用于删除测试
      const tempHistoryData = {
        url: "https://temp-delete-test.com",
        title: "Temp Delete Test",
        visitCount: 1,
        typedCount: 0
      }

      const createResponse = await client.history.createHistoryItem(
        authToken,
        tempHistoryData
      )
      expect(createResponse.status).toBe(200)

      const createData = await createResponse.json()
      const tempId = createData.data.id

      // 删除记录
      const deleteResponse = await client.history.deleteHistoryItem(
        authToken,
        tempId
      )
      expect(deleteResponse.status).toBe(200)

      const deleteData = await deleteResponse.json()
      expect(deleteData.success).toBe(true)
      expect(deleteData.message).toContain("删除历史记录成功")

      // 验证记录已被删除
      const getResponse = await client.history.getHistoryItem(authToken, tempId)
      expect(getResponse.status).toBe(404)
    })
  })

  describe("搜索功能", () => {
    beforeAll(async () => {
      // 创建更多测试数据用于搜索
      for (let i = 1; i < testHistoryItems.length; i++) {
        const response = await client.history.createHistoryItem(
          authToken,
          testHistoryItems[i]
        )
        const data = await response.json()
        createdHistoryItems.push(data.data.id)
      }
    })

    test("基本搜索", async () => {
      const response = await client.history.searchHistory(authToken, {
        q: "GitHub",
        limit: 10
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("搜索历史记录成功")
      expect(data.data).toBeInstanceOf(Array)
      expect(data.query).toBe("GitHub")

      // 验证搜索结果包含GitHub相关记录
      const githubItem = data.data.find((item: any) =>
        item.url.includes("github.com")
      )
      expect(githubItem).toBeDefined()
    })

    test("带时间范围的搜索", async () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      const response = await client.history.searchHistory(authToken, {
        q: "Example",
        startTime: oneHourAgo,
        endTime: now,
        limit: 10
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
    })

    test("高级查询参数", async () => {
      const response = await client.history.getHistory(authToken, {
        page: 1,
        pageSize: 5,
        search: "Stack",
        sortBy: "visitCount",
        sortOrder: "desc"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.items).toBeInstanceOf(Array)
      expect(data.data.pagination.pageSize).toBe(5)
    })
  })

  describe("批量操作", () => {
    test("批量创建历史记录", async () => {
      const batchData = {
        items: [
          {
            url: "https://batch1.com",
            title: "Batch Test 1",
            visitCount: 1,
            typedCount: 0
          },
          {
            url: "https://batch2.com",
            title: "Batch Test 2",
            visitCount: 2,
            typedCount: 1
          }
        ]
      }

      const response = await client.history.batchCreateHistory(
        authToken,
        batchData
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("批量创建")
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBe(2)
      expect(data.count).toBe(2)

      // 保存ID用于清理
      data.data.forEach((item: any) => {
        createdHistoryItems.push(item.id)
      })
    })

    test("批量更新历史记录", async () => {
      // 获取前两个记录用于批量更新测试
      const itemsToUpdate = createdHistoryItems.slice(0, 2)

      const batchUpdateData = {
        items: itemsToUpdate.map((id) => ({
          id,
          data: {
            visitCount: 99,
            typedCount: 10
          }
        }))
      }

      const response = await client.history.batchUpdateHistory(
        authToken,
        batchUpdateData
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("批量更新")
      expect(data.count).toBe(2)
    })

    test("批量删除历史记录", async () => {
      // 创建临时记录用于批量删除测试
      const tempItems = [
        {
          url: "https://temp-batch-delete1.com",
          title: "Temp Batch Delete 1",
          visitCount: 1,
          typedCount: 0
        },
        {
          url: "https://temp-batch-delete2.com",
          title: "Temp Batch Delete 2",
          visitCount: 1,
          typedCount: 0
        }
      ]

      const createResponse = await client.history.batchCreateHistory(
        authToken,
        {
          items: tempItems
        }
      )
      expect(createResponse.status).toBe(200)

      const createData = await createResponse.json()
      const tempIds = createData.data.map((item: any) => item.id)

      // 批量删除
      const deleteResponse = await client.history.batchDeleteHistory(
        authToken,
        {
          ids: tempIds
        }
      )

      expect(deleteResponse.status).toBe(200)

      const deleteData = await deleteResponse.json()
      expect(deleteData.success).toBe(true)
      expect(deleteData.message).toContain("批量删除")
      expect(deleteData.deletedCount).toBeGreaterThan(0)
    })
  })

  describe("时间范围操作", () => {
    test("按时间范围删除历史记录", async () => {
      // 创建临时记录用于时间范围删除测试
      const tempItem = {
        url: "https://temp-time-range-delete.com",
        title: "Temp Time Range Delete",
        visitCount: 1,
        typedCount: 0
      }

      const createResponse = await client.history.createHistoryItem(
        authToken,
        tempItem
      )
      expect(createResponse.status).toBe(200)

      const now = Date.now()
      const oneMinuteAgo = now - 60 * 1000
      const oneMinuteLater = now + 60 * 1000

      const deleteResponse = await client.history.deleteByTimeRange(authToken, {
        startTime: oneMinuteAgo,
        endTime: oneMinuteLater
      })

      expect(deleteResponse.status).toBe(200)

      const deleteData = await deleteResponse.json()
      expect(deleteData.success).toBe(true)
      expect(deleteData.message).toContain("删除时间范围内的历史记录成功")
      expect(deleteData.timeRange).toMatchObject({
        startTime: oneMinuteAgo,
        endTime: oneMinuteLater,
        domain: null
      })
    })
  })

  describe("统计功能", () => {
    test("获取基本统计信息", async () => {
      const response = await client.history.getStats(authToken)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("获取历史记录统计成功")
      expect(data.data).toMatchObject({
        totalVisits: expect.any(Number),
        uniqueUrls: expect.any(Number),
        topDomains: expect.any(Array)
      })

      // 验证热门域名格式
      if (data.data.topDomains.length > 0) {
        expect(data.data.topDomains[0]).toMatchObject({
          domain: expect.any(String),
          visitCount: expect.any(Number),
          lastVisit: expect.any(Number)
        })
      }
    })

    test("按天分组的统计", async () => {
      const response = await client.history.getStats(authToken, {
        groupBy: "day"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty("dailyStats")
      expect(data.data.dailyStats).toBeInstanceOf(Array)
    })

    test("按周分组的统计", async () => {
      const response = await client.history.getStats(authToken, {
        groupBy: "week"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty("weeklyStats")
      expect(data.data.weeklyStats).toBeInstanceOf(Array)
    })

    test("按月分组的统计", async () => {
      const response = await client.history.getStats(authToken, {
        groupBy: "month"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty("monthlyStats")
      expect(data.data.monthlyStats).toBeInstanceOf(Array)
    })
  })

  describe("热门网站", () => {
    test("获取热门网站 - 按访问次数排序", async () => {
      const response = await client.history.getTopSites(authToken, {
        limit: 5,
        sortBy: "visitCount"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain("获取热门网站成功")
      expect(data.data).toBeInstanceOf(Array)
      expect(data.total).toBe(data.data.length)
      expect(data.query).toMatchObject({
        limit: 5,
        sortBy: "visitCount"
      })

      // 验证排序（访问次数递减）
      if (data.data.length > 1) {
        for (let i = 0; i < data.data.length - 1; i++) {
          expect(data.data[i].visitCount).toBeGreaterThanOrEqual(
            data.data[i + 1].visitCount
          )
        }
      }
    })

    test("获取热门网站 - 按最后访问时间排序", async () => {
      const response = await client.history.getTopSites(authToken, {
        limit: 3,
        sortBy: "lastVisitTime"
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBeLessThanOrEqual(3)

      // 验证排序（最后访问时间递减）
      if (data.data.length > 1) {
        for (let i = 0; i < data.data.length - 1; i++) {
          expect(data.data[i].lastVisitTime).toBeGreaterThanOrEqual(
            data.data[i + 1].lastVisitTime
          )
        }
      }
    })

    test("带时间范围的热门网站查询", async () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      const response = await client.history.getTopSites(authToken, {
        startTime: oneHourAgo,
        endTime: now,
        limit: 10
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.query).toMatchObject({
        startTime: oneHourAgo,
        endTime: now,
        limit: 10
      })
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

    test("无效的URL格式", async () => {
      const invalidHistoryData = {
        url: "not-a-valid-url",
        title: "Invalid URL Test",
        visitCount: 1,
        typedCount: 0
      }

      const response = await client.history.createHistoryItem(
        authToken,
        invalidHistoryData
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    test("重复URL约束", async () => {
      const duplicateData = {
        url: "https://duplicate-test.com",
        title: "Duplicate Test",
        visitCount: 1,
        typedCount: 0
      }

      // 第一次创建应该成功
      const firstResponse = await client.history.createHistoryItem(
        authToken,
        duplicateData
      )
      expect(firstResponse.status).toBe(200)

      const firstData = await firstResponse.json()
      createdHistoryItems.push(firstData.data.id)

      // 第二次创建相同URL应该失败
      const secondResponse = await client.history.createHistoryItem(
        authToken,
        duplicateData
      )
      expect(secondResponse.status).toBe(409)

      const secondData = await secondResponse.json()
      expect(secondData.success).toBe(false)
      expect(secondData.message).toContain("已存在")
    })

    test("无效的查询参数", async () => {
      // 测试无效的页码
      const response = await client.history.getHistory(authToken, {
        page: 0, // 无效页码
        pageSize: 10
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    test("空的搜索查询", async () => {
      const response = await client.history.searchHistory(authToken, {
        q: "" // 空查询
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    test("无效的时间范围", async () => {
      const response = await client.history.deleteByTimeRange(authToken, {
        startTime: Date.now(),
        endTime: Date.now() - 1000 // 结束时间早于开始时间
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe("分页功能", () => {
    test("分页查询", async () => {
      // 测试第一页
      const page1Response = await client.history.getHistory(authToken, {
        page: 1,
        pageSize: 2
      })

      expect(page1Response.status).toBe(200)

      const page1Data = await page1Response.json()
      expect(page1Data.success).toBe(true)
      expect(page1Data.data.pagination.page).toBe(1)
      expect(page1Data.data.pagination.pageSize).toBe(2)

      // 如果有足够的数据，测试第二页
      if (page1Data.data.pagination.hasNextPage) {
        const page2Response = await client.history.getHistory(authToken, {
          page: 2,
          pageSize: 2
        })

        expect(page2Response.status).toBe(200)

        const page2Data = await page2Response.json()
        expect(page2Data.success).toBe(true)
        expect(page2Data.data.pagination.page).toBe(2)
      }
    })

    test("大页面大小限制", async () => {
      const response = await client.history.getHistory(authToken, {
        page: 1,
        pageSize: 1000 // 超过最大限制
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })
})
