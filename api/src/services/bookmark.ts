import type {
  Bookmark,
  BookmarkQuery,
  CreateBookmarkRequest,
  UpdateBookmarkRequest
} from "../schemas/bookmark"

// KVNamespace 类型定义 (Cloudflare Workers 特有)
interface KVNamespace {
  get(key: string): Promise<string | null>
  get(key: string, type: "text"): Promise<string | null>
  get(key: string, type: "json"): Promise<any>
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>
  get(key: string, type: "stream"): Promise<ReadableStream | null>
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    limit?: number
  }): Promise<{ keys: { name: string }[] }>
}

/**
 * 书签服务类
 */
export class BookmarkService {
  constructor(private kv: KVNamespace) {}

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取书签列表（分页）
   */
  async getBookmarks(query: BookmarkQuery): Promise<{
    data: Bookmark[]
    total: number
    page: number
    pageSize: number
    hasNextPage: boolean
  }> {
    const { page, pageSize, search, tags } = query

    // 获取所有书签键
    const listResult = await this.kv.list({ prefix: "bookmark_" })

    // 安全检查 keys 是否存在
    if (!listResult.keys || listResult.keys.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasNextPage: false
      }
    }

    const bookmarkKeys = listResult.keys.map((k) => k.name)

    // 批量获取书签数据
    const bookmarks: Bookmark[] = []
    for (const key of bookmarkKeys) {
      const bookmarkData = (await this.kv.get(key, "json")) as Bookmark | null
      if (bookmarkData) {
        bookmarks.push(bookmarkData)
      }
    }

    // 过滤书签
    let filteredBookmarks = bookmarks

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      filteredBookmarks = filteredBookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(searchLower) ||
          bookmark.url.toLowerCase().includes(searchLower) ||
          bookmark.description?.toLowerCase().includes(searchLower)
      )
    }

    // 标签过滤
    if (tags.length > 0) {
      filteredBookmarks = filteredBookmarks.filter((bookmark) =>
        tags.some((tag) => bookmark.tags?.includes(tag))
      )
    }

    // 按创建时间排序（最新的在前）
    filteredBookmarks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // 分页
    const total = filteredBookmarks.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedBookmarks = filteredBookmarks.slice(startIndex, endIndex)

    return {
      data: paginatedBookmarks,
      total,
      page,
      pageSize,
      hasNextPage: endIndex < total
    }
  }

  /**
   * 获取单个书签
   */
  async getBookmark(id: string): Promise<Bookmark | null> {
    const bookmark = (await this.kv.get(id, "json")) as Bookmark | null
    return bookmark
  }

  /**
   * 创建书签
   */
  async createBookmark(data: CreateBookmarkRequest): Promise<Bookmark> {
    const now = new Date().toISOString()
    const id = this.generateId()

    const bookmark: Bookmark = {
      id,
      title: data.title,
      url: data.url,
      tags: data.tags || [],
      description: data.description || "",
      createdAt: now,
      updatedAt: now
    }

    await this.kv.put(id, JSON.stringify(bookmark))
    return bookmark
  }

  /**
   * 更新书签
   */
  async updateBookmark(
    id: string,
    data: UpdateBookmarkRequest
  ): Promise<Bookmark | null> {
    const existingBookmark = await this.getBookmark(id)
    if (!existingBookmark) {
      return null
    }

    const updatedBookmark: Bookmark = {
      ...existingBookmark,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await this.kv.put(id, JSON.stringify(updatedBookmark))
    return updatedBookmark
  }

  /**
   * 删除书签
   */
  async deleteBookmark(id: string): Promise<boolean> {
    const exists = await this.getBookmark(id)
    if (!exists) {
      return false
    }

    await this.kv.delete(id)
    return true
  }

  /**
   * 搜索书签
   */
  async searchBookmarks(
    keyword: string,
    options: {
      tags?: string[]
      limit?: number
    } = {}
  ): Promise<Bookmark[]> {
    const { tags = [], limit = 10 } = options

    // 获取所有书签
    const allBookmarks = await this.getBookmarks({
      page: 1,
      pageSize: 1000, // 获取大量数据用于搜索
      search: keyword,
      tags
    })

    return allBookmarks.data.slice(0, limit)
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    const listResult = await this.kv.list({ prefix: "bookmark_" })

    // 安全检查 keys 是否存在
    if (!listResult.keys || listResult.keys.length === 0) {
      return []
    }

    const bookmarkKeys = listResult.keys.map((k) => k.name)

    const tagsSet = new Set<string>()

    for (const key of bookmarkKeys) {
      const bookmark = (await this.kv.get(key, "json")) as Bookmark | null
      if (bookmark?.tags) {
        bookmark.tags.forEach((tag) => tagsSet.add(tag))
      }
    }

    return Array.from(tagsSet).sort()
  }

  /**
   * 检查 URL 是否已存在书签
   */
  async checkBookmarkExists(url: string): Promise<boolean> {
    const listResult = await this.kv.list({ prefix: "bookmark_" })

    // 安全检查 keys 是否存在
    if (!listResult.keys || listResult.keys.length === 0) {
      return false
    }

    const bookmarkKeys = listResult.keys.map((k) => k.name)

    for (const key of bookmarkKeys) {
      const bookmark = (await this.kv.get(key, "json")) as Bookmark | null
      if (bookmark?.url === url) {
        return true
      }
    }

    return false
  }
}
