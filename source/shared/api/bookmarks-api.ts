import { BaseApiClient } from "./base-client"
import type {
  Bookmark,
  BookmarkResponse,
  CreateBookmarkDto,
  UpdateBookmarkDto
} from "./types"

export class BookmarksApi extends BaseApiClient {
  // 个人书签 API

  /**
   * 获取个人书签列表
   */
  async getBookmarks(): Promise<Bookmark[]> {
    return await this.get<Bookmark[]>("api/bookmarks")
  }

  /**
   * 创建个人书签
   */
  async createBookmark(data: CreateBookmarkDto): Promise<BookmarkResponse> {
    return await this.post<BookmarkResponse>("api/bookmarks", data)
  }

  /**
   * 更新个人书签
   */
  async updateBookmark(
    id: string,
    data: UpdateBookmarkDto
  ): Promise<BookmarkResponse> {
    return await this.put<BookmarkResponse>(`api/bookmarks/${id}`, data)
  }

  /**
   * 删除个人书签
   */
  async deleteBookmark(id: string): Promise<BookmarkResponse> {
    return await this.delete<BookmarkResponse>(`api/bookmarks/${id}`)
  }

  // 团队书签 API

  /**
   * 获取团队书签列表
   */
  async getTeamBookmarks(teamId: string): Promise<Bookmark[]> {
    return await this.get<Bookmark[]>(`api/teams/${teamId}/bookmarks`)
  }

  /**
   * 创建团队书签
   */
  async createTeamBookmark(
    teamId: string,
    data: CreateBookmarkDto
  ): Promise<BookmarkResponse> {
    return await this.post<BookmarkResponse>(
      `api/teams/${teamId}/bookmarks`,
      data
    )
  }

  /**
   * 更新团队书签
   */
  async updateTeamBookmark(
    teamId: string,
    id: string,
    data: UpdateBookmarkDto
  ): Promise<BookmarkResponse> {
    return await this.put<BookmarkResponse>(
      `api/teams/${teamId}/bookmarks/${id}`,
      data
    )
  }

  /**
   * 删除团队书签
   */
  async deleteTeamBookmark(
    teamId: string,
    id: string
  ): Promise<BookmarkResponse> {
    return await this.delete<BookmarkResponse>(
      `api/teams/${teamId}/bookmarks/${id}`
    )
  }

  // 实用方法

  /**
   * 根据 URL 查找书签
   */
  async findBookmarkByUrl(url: string): Promise<Bookmark | null> {
    const bookmarks = await this.getBookmarks()
    return bookmarks.find((bookmark) => bookmark.url === url) || null
  }

  /**
   * 批量创建书签
   */
  async batchCreateBookmarks(
    bookmarks: CreateBookmarkDto[]
  ): Promise<BookmarkResponse[]> {
    const results: BookmarkResponse[] = []

    for (const bookmark of bookmarks) {
      try {
        const result = await this.createBookmark(bookmark)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return results
  }

  /**
   * 获取书签树结构
   */
  async getBookmarkTree(): Promise<Bookmark[]> {
    const bookmarks = await this.getBookmarks()

    // 构建树结构的辅助函数
    const buildTree = (parentId: string | null): Bookmark[] => {
      return bookmarks
        .filter((bookmark) => bookmark.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((bookmark) => ({
          ...bookmark,
          children: buildTree(bookmark.id)
        }))
    }

    return buildTree(null)
  }
}
