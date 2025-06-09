import { beforeEach, describe, expect, it, vi } from "vitest"

import { BookmarkSchema, CreateBookmarkSchema } from "../schemas/bookmark"
import type { Bookmark, CreateBookmarkRequest } from "../schemas/bookmark"
import { BookmarkService } from "./bookmark"

// Mock KV namespace
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn()
}

describe("BookmarkService", () => {
  let bookmarkService: BookmarkService

  beforeEach(() => {
    vi.clearAllMocks()
    bookmarkService = new BookmarkService(mockKV as any)
  })

  describe("数据验证", () => {
    it("应该验证有效的书签数据", () => {
      const validBookmark: Bookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "https://example.com",
        parentId: "1",
        index: 0,
        dateAdded: Date.now(),
        tags: ["tech", "example"],
        description: "这是一个测试书签",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }

      const result = BookmarkSchema.safeParse(validBookmark)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe("测试书签")
        expect(result.data.url).toBe("https://example.com")
        expect(result.data.tags).toEqual(["tech", "example"])
      }
    })

    it("应该验证 Chrome BookmarkTreeNode 文件夹", () => {
      const validFolder: Bookmark = {
        id: "folder_123",
        title: "测试文件夹",
        parentId: "0",
        index: 0,
        dateAdded: Date.now(),
        dateGroupModified: Date.now(),
        children: [
          {
            id: "bookmark_456",
            title: "子书签",
            url: "https://child.example.com",
            parentId: "folder_123",
            index: 0,
            dateAdded: Date.now()
          }
        ]
      }

      const result = BookmarkSchema.safeParse(validFolder)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.children).toBeDefined()
        expect(result.data.children![0].title).toBe("子书签")
      }
    })

    it("应该拒绝无效的 URL", () => {
      const invalidBookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "invalid-url",
        tags: ["tech"]
      }

      const result = BookmarkSchema.safeParse(invalidBookmark)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("URL 格式不正确")
      }
    })

    it("应该拒绝空标题", () => {
      const invalidBookmark = {
        id: "bookmark_123",
        title: "",
        url: "https://example.com"
      }

      const result = BookmarkSchema.safeParse(invalidBookmark)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("标题不能为空")
      }
    })
  })

  describe("创建书签验证", () => {
    it("应该验证有效的创建书签请求", () => {
      const validRequest: CreateBookmarkRequest = {
        title: "新书签",
        url: "https://new.example.com",
        tags: ["new", "test"],
        description: "新建的测试书签"
      }

      const result = CreateBookmarkSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe("新书签")
        expect(result.data.tags).toEqual(["new", "test"])
      }
    })

    it("应该拒绝过长的标题", () => {
      const invalidRequest = {
        title: "x".repeat(201), // 超过200字符限制
        url: "https://example.com"
      }

      const result = CreateBookmarkSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("标题过长")
      }
    })

    it("应该拒绝过长的描述", () => {
      const invalidRequest = {
        title: "测试书签",
        url: "https://example.com",
        description: "x".repeat(1001) // 超过1000字符限制
      }

      const result = CreateBookmarkSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("描述过长")
      }
    })
  })

  describe("BookmarkService 方法", () => {
    it("应该创建有效的书签", async () => {
      const createRequest: CreateBookmarkRequest = {
        title: "测试书签",
        url: "https://test.example.com",
        tags: ["test"],
        description: "测试描述"
      }

      mockKV.put.mockResolvedValue(undefined)

      const result = await bookmarkService.createBookmark(createRequest)

      expect(result.title).toBe("测试书签")
      expect(result.url).toBe("https://test.example.com")
      expect(result.tags).toEqual(["test"])
      expect(result.id).toMatch(/^bookmark_/)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(mockKV.put).toHaveBeenCalledOnce()
    })

    it("应该获取单个书签", async () => {
      const mockBookmark: Bookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "https://example.com",
        tags: ["test"],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }

      // 当使用 'json' 参数时，KV 会自动解析 JSON
      mockKV.get.mockResolvedValue(mockBookmark)

      const result = await bookmarkService.getBookmark("bookmark_123")

      expect(result).toEqual(mockBookmark)
      expect(mockKV.get).toHaveBeenCalledWith("bookmark_123", "json")
    })

    it("应该返回null当书签不存在时", async () => {
      mockKV.get.mockResolvedValue(null)

      const result = await bookmarkService.getBookmark("nonexistent")

      expect(result).toBeNull()
    })

    it("应该删除书签", async () => {
      const mockBookmark: Bookmark = {
        id: "bookmark_123",
        title: "测试书签",
        url: "https://example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }

      mockKV.get.mockResolvedValue(mockBookmark)
      mockKV.delete.mockResolvedValue(undefined)

      const result = await bookmarkService.deleteBookmark("bookmark_123")

      expect(result).toBe(true)
      expect(mockKV.delete).toHaveBeenCalledWith("bookmark_123")
    })

    it("应该返回false当删除不存在的书签时", async () => {
      mockKV.get.mockResolvedValue(null)

      const result = await bookmarkService.deleteBookmark("nonexistent")

      expect(result).toBe(false)
      expect(mockKV.delete).not.toHaveBeenCalled()
    })

    it("应该检查URL是否存在", async () => {
      const mockBookmarks = [
        {
          id: "bookmark_1",
          title: "书签1",
          url: "https://example.com"
        },
        {
          id: "bookmark_2",
          title: "书签2",
          url: "https://other.com"
        }
      ]

      mockKV.list.mockResolvedValue({
        keys: [{ name: "bookmark_1" }, { name: "bookmark_2" }]
      })

      mockKV.get
        .mockResolvedValueOnce(mockBookmarks[0])
        .mockResolvedValueOnce(mockBookmarks[1])

      const exists = await bookmarkService.checkBookmarkExists(
        "https://example.com"
      )
      const notExists = await bookmarkService.checkBookmarkExists(
        "https://notfound.com"
      )

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })
  })

  describe("数据类型兼容性", () => {
    it("应该与Chrome BookmarkTreeNode兼容", () => {
      // 模拟 Chrome 原生书签数据
      const chromeBookmark = {
        id: "123",
        parentId: "1",
        index: 0,
        title: "Chrome 书签",
        url: "https://chrome.example.com",
        dateAdded: 1640995200000, // 2022-01-01 timestamp
        unmodifiable: "managed" as const
      }

      const result = BookmarkSchema.safeParse(chromeBookmark)
      expect(result.success).toBe(true)
    })

    it("应该处理书签文件夹", () => {
      const chromeFolder = {
        id: "folder_1",
        parentId: "0",
        index: 0,
        title: "书签文件夹",
        dateAdded: 1640995200000,
        dateGroupModified: 1640995200000,
        children: [
          {
            id: "bookmark_child",
            parentId: "folder_1",
            index: 0,
            title: "子书签",
            url: "https://child.example.com",
            dateAdded: 1640995200000
          }
        ]
      }

      const result = BookmarkSchema.safeParse(chromeFolder)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.children).toBeDefined()
        expect(result.data.children![0].url).toBe("https://child.example.com")
      }
    })
  })
})
