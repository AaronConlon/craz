import type {
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest
} from "../../features/tab-switcher/types"
import type { ApiResponse, PaginatedResponse } from "../types"
import { api } from "./client"

/**
 * 书签 API 服务
 */
export class BookmarksApiService {
  private static readonly BASE_PATH = "/bookmarks"

  /**
   * 获取所有书签（分页）
   */
  static async getBookmarks(params?: {
    page?: number
    pageSize?: number
    search?: string
    tags?: string[]
  }): Promise<PaginatedResponse<Bookmark>> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.pageSize)
      searchParams.set("pageSize", params.pageSize.toString())
    if (params?.search) searchParams.set("search", params.search)
    if (params?.tags?.length) searchParams.set("tags", params.tags.join(","))

    const url = `${this.BASE_PATH}?${searchParams.toString()}`
    return api.get<PaginatedResponse<Bookmark>>(url)
  }

  /**
   * 根据 ID 获取单个书签
   */
  static async getBookmark(id: string): Promise<Bookmark> {
    const response = await api.get<ApiResponse<Bookmark>>(
      `${this.BASE_PATH}/${id}`
    )
    return response.data
  }

  /**
   * 创建新书签
   */
  static async createBookmark(data: CreateBookmarkRequest): Promise<Bookmark> {
    const response = await api.post<ApiResponse<Bookmark>>(this.BASE_PATH, data)
    return response.data
  }

  /**
   * 更新书签
   */
  static async updateBookmark(
    id: string,
    data: UpdateBookmarkRequest
  ): Promise<Bookmark> {
    const response = await api.put<ApiResponse<Bookmark>>(
      `${this.BASE_PATH}/${id}`,
      data
    )
    return response.data
  }

  /**
   * 删除书签
   */
  static async deleteBookmark(id: string): Promise<void> {
    await api.delete(`${this.BASE_PATH}/${id}`)
  }

  /**
   * 搜索书签
   */
  static async searchBookmarks(
    query: string,
    options?: {
      tags?: string[]
      limit?: number
    }
  ): Promise<Bookmark[]> {
    const searchParams = new URLSearchParams()
    searchParams.set("q", query)

    if (options?.tags?.length) {
      searchParams.set("tags", options.tags.join(","))
    }
    if (options?.limit) {
      searchParams.set("limit", options.limit.toString())
    }

    const url = `${this.BASE_PATH}/search?${searchParams.toString()}`
    const response = await api.get<ApiResponse<Bookmark[]>>(url)
    return response.data
  }

  /**
   * 获取所有标签
   */
  static async getTags(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>(
      `${this.BASE_PATH}/tags`
    )
    return response.data
  }

  /**
   * 检查 URL 是否已存在书签
   */
  static async checkBookmarkExists(url: string): Promise<boolean> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set("url", url)

      const response = await api.get<ApiResponse<{ exists: boolean }>>(
        `${this.BASE_PATH}/check?${searchParams.toString()}`
      )
      return response.data.exists
    } catch {
      return false
    }
  }
}
