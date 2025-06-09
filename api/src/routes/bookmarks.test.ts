import { beforeEach, describe, expect, it, vi } from "vitest"

import app from "../index"
import type { Env } from "../index"

// Mock environment
const mockEnv: Env = {
  BOOKMARKS_KV: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  ENVIRONMENT: "test"
}

describe("Bookmarks API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /bookmarks", () => {
    it("应该创建有效的书签", async () => {
      const validBookmark = {
        title: "测试书签",
        url: "https://example.com",
        tags: ["test", "example"],
        description: "这是一个测试书签"
      }

      // Mock checkBookmarkExists 方法的依赖
      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({ keys: [] })
      mockEnv.BOOKMARKS_KV.put = vi.fn().mockResolvedValue(undefined)

      const response = await app.request(
        "/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBookmark)
        },
        mockEnv
      )

      expect(response.status).toBe(201)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.title).toBe("测试书签")
      expect(result.data.url).toBe("https://example.com")
      expect(result.data.tags).toEqual(["test", "example"])
      expect(result.data.id).toMatch(/^bookmark_/)
    })

    it("应该拒绝无效的URL", async () => {
      const invalidBookmark = {
        title: "测试书签",
        url: "invalid-url",
        tags: ["test"]
      }

      const response = await app.request(
        "/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidBookmark)
        },
        mockEnv
      )

      expect(response.status).toBe(400)

      const result = await response.json()
      expect(result.success).toBe(false)
    })

    it("应该拒绝空标题", async () => {
      const invalidBookmark = {
        title: "",
        url: "https://example.com"
      }

      const response = await app.request(
        "/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidBookmark)
        },
        mockEnv
      )

      expect(response.status).toBe(400)

      const result = await response.json()
      expect(result.success).toBe(false)
    })

    it("应该拒绝过长的标题", async () => {
      const invalidBookmark = {
        title: "x".repeat(201),
        url: "https://example.com"
      }

      const response = await app.request(
        "/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidBookmark)
        },
        mockEnv
      )

      expect(response.status).toBe(400)

      const result = await response.json()
      expect(result.success).toBe(false)
    })

    it("应该拒绝重复的URL", async () => {
      const duplicateBookmark = {
        title: "重复书签",
        url: "https://existing.com"
      }

      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({
        keys: [{ name: "bookmark_1" }]
      })
      mockEnv.BOOKMARKS_KV.get = vi.fn().mockResolvedValue({
        id: "bookmark_1",
        title: "现有书签",
        url: "https://existing.com"
      })

      const response = await app.request(
        "/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateBookmark)
        },
        mockEnv
      )

      expect(response.status).toBe(409)

      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.message).toContain("URL 已存在")
    })
  })

  describe("GET /bookmarks", () => {
    it("应该返回书签列表", async () => {
      const mockBookmarks = [
        {
          id: "bookmark_1",
          title: "书签1",
          url: "https://example1.com",
          tags: ["tag1"],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "bookmark_2",
          title: "书签2",
          url: "https://example2.com",
          tags: ["tag2"],
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z"
        }
      ]

      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({
        keys: [{ name: "bookmark_1" }, { name: "bookmark_2" }]
      })

      mockEnv.BOOKMARKS_KV.get = vi
        .fn()
        .mockResolvedValueOnce(mockBookmarks[0])
        .mockResolvedValueOnce(mockBookmarks[1])

      const response = await app.request("/bookmarks", {}, mockEnv)

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    it("应该支持分页参数", async () => {
      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({ keys: [] })

      const response = await app.request(
        "/bookmarks?page=2&pageSize=10",
        {},
        mockEnv
      )

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.pageSize).toBe(10)
    })
  })

  describe("GET /bookmarks/:id", () => {
    it("应该返回指定的书签", async () => {
      const mockBookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "https://example.com",
        tags: ["test"]
      }

      mockEnv.BOOKMARKS_KV.get = vi.fn().mockResolvedValue(mockBookmark)

      const response = await app.request("/bookmarks/bookmark_123", {}, mockEnv)

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.id).toBe("bookmark_123")
    })

    it("应该返回404当书签不存在", async () => {
      mockEnv.BOOKMARKS_KV.get = vi.fn().mockResolvedValue(null)

      const response = await app.request("/bookmarks/nonexistent", {}, mockEnv)

      expect(response.status).toBe(404)

      const result = await response.json()
      expect(result.success).toBe(false)
    })
  })

  describe("DELETE /bookmarks/:id", () => {
    it("应该删除指定的书签", async () => {
      const mockBookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "https://example.com"
      }

      mockEnv.BOOKMARKS_KV.get = vi.fn().mockResolvedValue(mockBookmark)
      mockEnv.BOOKMARKS_KV.delete = vi.fn().mockResolvedValue(undefined)

      const response = await app.request(
        "/bookmarks/bookmark_123",
        {
          method: "DELETE"
        },
        mockEnv
      )

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(mockEnv.BOOKMARKS_KV.delete).toHaveBeenCalledWith("bookmark_123")
    })
  })

  describe("GET /bookmarks/check", () => {
    it("应该检查URL是否存在", async () => {
      // 设置更详细的 mock 数据
      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({
        keys: [{ name: "bookmark_1" }]
      })
      mockEnv.BOOKMARKS_KV.get = vi.fn().mockResolvedValue({
        id: "bookmark_1",
        title: "测试书签",
        url: "https://example.com",
        tags: ["test"],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      })

      const response = await app.request(
        "/bookmarks/check?url=https://example.com",
        {},
        mockEnv
      )

      expect(response.status).toBe(200)

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.exists).toBe(true)
    })

    it("应该要求URL参数", async () => {
      // 不提供 URL 查询参数时应该返回 400
      mockEnv.BOOKMARKS_KV.list = vi.fn().mockResolvedValue({ keys: [] })

      const response = await app.request("/bookmarks/check", {}, mockEnv)

      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toContain("URL 参数")
    })
  })

  describe("健康检查", () => {
    it("应该返回API状态", async () => {
      const response = await app.request("/", {}, mockEnv)

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.message).toContain("Craz API 服务运行中")
      expect(result.environment).toBe("test")
    })
  })
})
