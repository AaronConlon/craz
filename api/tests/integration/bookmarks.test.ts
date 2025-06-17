import { beforeEach, describe, expect, test } from "vitest"

import {
  AuthSuccessResponseSchema,
  BookmarkCreateResponseSchema,
  BookmarkExistsResponseSchema,
  BookmarkListResponseSchema,
  BookmarkResponseSchema,
  BookmarkSearchResponseSchema,
  BookmarkTagsResponseSchema,
  BookmarkUpdateResponseSchema,
  CreateBookmarkRequestSchema,
  UpdateBookmarkRequestSchema
} from "../schemas/api-responses"
import {
  AuthApiClient,
  BookmarkApiClient,
  ResponseValidator
} from "../utils/api-client"

describe("书签接口测试", () => {
  const authClient = new AuthApiClient()
  const bookmarkClient = new BookmarkApiClient()

  // 测试用户和认证令牌
  let testUser: any
  let authToken: string

  // 测试数据
  const generateTestUser = () => {
    const timestamp = Date.now().toString().slice(-8)
    const randomStr = Math.random().toString(36).substr(2, 4)
    return {
      username: `test_${timestamp.slice(-6)}_${randomStr}`,
      email: `test_${timestamp}_${randomStr}@example.com`,
      password: "password123",
      receiveOfficialMessages: true
    }
  }

  const generateTestBookmark = () => {
    const timestamp = Date.now()
    return {
      title: `测试书签 ${timestamp}`,
      url: `https://example.com/test-${timestamp}`,
      parentId: null,
      sortOrder: 0,
      metadata: {
        tags: ["测试", "自动化"],
        description: `这是一个测试书签，创建于 ${new Date().toISOString()}`
      }
    }
  }

  const invalidBookmark = {
    title: "", // 空标题
    url: "invalid-url", // 无效 URL
    parentId: null,
    sortOrder: 0,
    metadata: {
      tags: ["测试"],
      description: "无效的书签数据"
    }
  }

  // 在每个测试前准备认证用户
  beforeEach(async () => {
    // 注册并登录获取令牌
    testUser = generateTestUser()
    const registerResponse = await authClient.register(testUser)
    const registerData = await ResponseValidator.validate(
      registerResponse,
      201,
      AuthSuccessResponseSchema
    )
    authToken = registerData.data.token
  })

  describe("书签基础操作", () => {
    test("成功创建书签", async () => {
      const testBookmark = generateTestBookmark()

      // 验证请求数据格式
      const validatedRequest = CreateBookmarkRequestSchema.parse(testBookmark)
      expect(validatedRequest).toBeDefined()

      const response = await bookmarkClient.createBookmark(
        authToken,
        testBookmark
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkCreateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.id).toBeDefined()
      expect(typeof data.id === "string" || typeof data.id === "number").toBe(
        true
      )
    })

    test("拒绝无效的书签数据", async () => {
      const response = await bookmarkClient.createBookmark(
        authToken,
        invalidBookmark
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("成功获取书签列表", async () => {
      // 先创建几个测试书签
      const testBookmarks = [
        generateTestBookmark(),
        generateTestBookmark(),
        generateTestBookmark()
      ]

      for (const bookmark of testBookmarks) {
        await bookmarkClient.createBookmark(authToken, bookmark)
      }

      const response = await bookmarkClient.getBookmarks(authToken)

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkListResponseSchema
      )

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(3)

      // 验证分页信息
      if (data.pagination) {
        expect(data.pagination.total).toBeGreaterThanOrEqual(3)
        expect(data.pagination.page).toBe(1)
        expect(data.pagination.pageSize).toBeGreaterThan(0)
        expect(typeof data.pagination.hasNextPage).toBe("boolean")
      }
    })

    test("支持分页查询书签", async () => {
      // 创建足够多的书签以测试分页
      const testBookmarks = Array.from({ length: 25 }, () =>
        generateTestBookmark()
      )

      for (const bookmark of testBookmarks) {
        await bookmarkClient.createBookmark(authToken, bookmark)
      }

      // 测试第一页
      const firstPageResponse = await bookmarkClient.getBookmarks(authToken, {
        page: 1,
        pageSize: 10
      })

      const firstPageData = await ResponseValidator.validate(
        firstPageResponse,
        200,
        BookmarkListResponseSchema
      )

      expect(firstPageData.data.length).toBeLessThanOrEqual(10)
      expect(firstPageData.pagination?.page).toBe(1)
      expect(firstPageData.pagination?.pageSize).toBe(10)

      // 测试第二页
      const secondPageResponse = await bookmarkClient.getBookmarks(authToken, {
        page: 2,
        pageSize: 10
      })

      const secondPageData = await ResponseValidator.validate(
        secondPageResponse,
        200,
        BookmarkListResponseSchema
      )

      expect(secondPageData.data.length).toBeGreaterThan(0)
      expect(secondPageData.pagination?.page).toBe(2)
    })
  })

  describe("书签查询操作", () => {
    let createdBookmarkId: string

    beforeEach(async () => {
      // 创建一个测试书签用于查询
      const testBookmark = generateTestBookmark()
      const createResponse = await bookmarkClient.createBookmark(
        authToken,
        testBookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        BookmarkCreateResponseSchema
      )
      createdBookmarkId = createData.id.toString()
    })

    test("成功获取单个书签", async () => {
      const response = await bookmarkClient.getBookmark(
        authToken,
        createdBookmarkId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.id).toBe(createdBookmarkId)
      expect(data.data.title).toBeDefined()
      expect(data.data.url).toBeDefined()
    })

    test("获取不存在的书签返回404", async () => {
      const response = await bookmarkClient.getBookmark(
        authToken,
        "nonexistent-id"
      )

      await ResponseValidator.validateError(response, 404, "书签不存在")
    })

    test("成功检查书签是否存在", async () => {
      const testBookmark = generateTestBookmark()
      await bookmarkClient.createBookmark(authToken, testBookmark)

      const response = await bookmarkClient.checkBookmarkExists(
        authToken,
        testBookmark.url
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkExistsResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.exists).toBe(true)
    })

    test("检查不存在的书签", async () => {
      const response = await bookmarkClient.checkBookmarkExists(
        authToken,
        "https://example.com/nonexistent"
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkExistsResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.exists).toBe(false)
    })
  })

  describe("书签搜索功能", () => {
    beforeEach(async () => {
      // 创建一些带有特定标签和标题的测试书签
      const searchTestBookmarks = [
        {
          title: "Vue.js 官方文档",
          url: "https://vuejs.org/guide/",
          parentId: null,
          sortOrder: 0,
          metadata: {
            tags: ["vue", "javascript", "前端"],
            description: "Vue.js 框架的官方文档"
          }
        },
        {
          title: "React 入门指南",
          url: "https://react.dev/learn",
          parentId: null,
          sortOrder: 1,
          metadata: {
            tags: ["react", "javascript", "前端"],
            description: "React 框架的学习资源"
          }
        },
        {
          title: "Node.js 后端开发",
          url: "https://nodejs.org/docs/",
          parentId: null,
          sortOrder: 2,
          metadata: {
            tags: ["nodejs", "javascript", "后端"],
            description: "Node.js 后端开发文档"
          }
        }
      ]

      for (const bookmark of searchTestBookmarks) {
        await bookmarkClient.createBookmark(authToken, bookmark)
      }
    })

    test("按关键词搜索书签", async () => {
      const response = await bookmarkClient.searchBookmarks(authToken, "Vue")

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkSearchResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.query).toBe("Vue")
      expect(data.total).toBeGreaterThan(0)
      expect(data.data.some((bookmark) => bookmark.title.includes("Vue"))).toBe(
        true
      )
    })

    test("按标签搜索书签", async () => {
      const response = await bookmarkClient.searchBookmarks(
        authToken,
        "javascript",
        {
          tags: "javascript"
        }
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkSearchResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.total).toBeGreaterThan(0)
      expect(
        data.data.every(
          (bookmark) =>
            bookmark.tags?.includes("javascript") ||
            bookmark.title.toLowerCase().includes("javascript")
        )
      ).toBe(true)
    })

    test("限制搜索结果数量", async () => {
      const response = await bookmarkClient.searchBookmarks(
        authToken,
        "javascript",
        {
          limit: 2
        }
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkSearchResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(2)
    })

    test("搜索不存在的内容", async () => {
      const response = await bookmarkClient.searchBookmarks(
        authToken,
        "不存在的搜索词"
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkSearchResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.total).toBe(0)
      expect(data.data).toEqual([])
    })
  })

  describe("书签标签管理", () => {
    beforeEach(async () => {
      // 创建带有不同标签的测试书签
      const taggedBookmarks = [
        {
          title: "前端资源1",
          url: "https://example.com/frontend1",
          parentId: null,
          sortOrder: 0,
          metadata: {
            tags: ["前端", "javascript", "css"]
          }
        },
        {
          title: "后端资源1",
          url: "https://example.com/backend1",
          parentId: null,
          sortOrder: 1,
          metadata: {
            tags: ["后端", "nodejs", "数据库"]
          }
        },
        {
          title: "设计资源1",
          url: "https://example.com/design1",
          parentId: null,
          sortOrder: 2,
          metadata: {
            tags: ["设计", "ui", "ux"]
          }
        }
      ]

      for (const bookmark of taggedBookmarks) {
        await bookmarkClient.createBookmark(authToken, bookmark)
      }
    })

    test("获取所有标签", async () => {
      const response = await bookmarkClient.getTags(authToken)

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkTagsResponseSchema
      )

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)

      // 验证包含我们创建的标签
      const tags = data.data
      expect(tags).toEqual(expect.arrayContaining(["前端", "后端", "设计"]))
    })
  })

  describe("书签更新和删除", () => {
    let createdBookmarkId: string
    let originalBookmark: any

    beforeEach(async () => {
      // 创建一个测试书签用于更新和删除
      originalBookmark = generateTestBookmark()
      const createResponse = await bookmarkClient.createBookmark(
        authToken,
        originalBookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        BookmarkCreateResponseSchema
      )
      createdBookmarkId = createData.id.toString()
    })

    test("成功更新书签", async () => {
      const updateData = {
        title: "更新后的标题",
        metadata: {
          tags: ["更新", "测试"],
          description: "更新后的描述"
        }
      }

      // 验证更新请求数据格式
      const validatedUpdate = UpdateBookmarkRequestSchema.parse(updateData)
      expect(validatedUpdate).toBeDefined()

      const response = await bookmarkClient.updateBookmark(
        authToken,
        createdBookmarkId,
        updateData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)

      // 验证更新后的数据
      const getResponse = await bookmarkClient.getBookmark(
        authToken,
        createdBookmarkId
      )
      const getResponseData = await ResponseValidator.validate(
        getResponse,
        200,
        BookmarkResponseSchema
      )

      expect(getResponseData.data.title).toBe(updateData.title)
      expect(getResponseData.data.metadata?.description).toBe(
        updateData.metadata.description
      )
    })

    test("拒绝无效的更新数据", async () => {
      const invalidUpdateData = {
        title: "", // 空标题
        url: "invalid-url" // 无效 URL
      }

      const response = await bookmarkClient.updateBookmark(
        authToken,
        createdBookmarkId,
        invalidUpdateData
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("成功删除书签", async () => {
      const response = await bookmarkClient.deleteBookmark(
        authToken,
        createdBookmarkId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)

      // 验证书签已被删除
      const getResponse = await bookmarkClient.getBookmark(
        authToken,
        createdBookmarkId
      )
      await ResponseValidator.validateError(getResponse, 404)
    })

    test("删除不存在的书签", async () => {
      const response = await bookmarkClient.deleteBookmark(
        authToken,
        "nonexistent-id"
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        BookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBe(0) // 没有影响的行数
    })
  })

  describe("认证和权限控制", () => {
    test("拒绝无效的认证令牌", async () => {
      const response = await bookmarkClient.getBookmarks("invalid-token")

      await ResponseValidator.validateError(response, 401)
    })

    test("拒绝缺失的认证令牌", async () => {
      const response = await bookmarkClient.getBookmarks("")

      await ResponseValidator.validateError(response, 401)
    })

    test("用户只能访问自己的书签", async () => {
      // 创建另一个用户
      const anotherUser = generateTestUser()
      const anotherRegisterResponse = await authClient.register(anotherUser)
      const anotherRegisterData = await ResponseValidator.validate(
        anotherRegisterResponse,
        201,
        AuthSuccessResponseSchema
      )
      const anotherToken = anotherRegisterData.data.token

      // 第一个用户创建书签
      const bookmark = generateTestBookmark()
      const createResponse = await bookmarkClient.createBookmark(
        authToken,
        bookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        BookmarkCreateResponseSchema
      )
      const bookmarkId = createData.id.toString()

      // 第二个用户尝试获取第一个用户的书签应该失败
      const getResponse = await bookmarkClient.getBookmark(
        anotherToken,
        bookmarkId
      )

      // 根据实际的权限控制实现，这里可能返回404或403
      expect([404, 403]).toContain(getResponse.status)
    })
  })

  describe("数据验证", () => {
    test("拒绝过长的标题", async () => {
      const longTitle = "a".repeat(201) // 超过200字符限制
      const bookmark = {
        ...generateTestBookmark(),
        title: longTitle
      }

      const response = await bookmarkClient.createBookmark(authToken, bookmark)

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝过长的描述", async () => {
      const longDescription = "a".repeat(1001) // 超过1000字符限制
      const bookmark = {
        ...generateTestBookmark(),
        description: longDescription
      }

      const response = await bookmarkClient.createBookmark(authToken, bookmark)

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝无效的URL格式", async () => {
      const bookmark = {
        title: "测试书签",
        url: "not-a-valid-url",
        parentId: null,
        sortOrder: 0,
        metadata: {
          tags: ["测试"]
        }
      }

      const response = await bookmarkClient.createBookmark(authToken, bookmark)

      await ResponseValidator.validateError(response, 400)
    })
  })
})
