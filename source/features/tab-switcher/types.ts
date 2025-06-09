// 使用 Chrome 原生类型
export type Tab = chrome.tabs.Tab
export type Bookmark = chrome.bookmarks.BookmarkTreeNode & {
  tags?: string[]
  description?: string
  createdAt?: string
  updatedAt?: string
}

// 标签页切换器配置
export interface TabSwitcherConfig {
  maxRecentTabs: number
  showFavIcon: boolean
  enableKeyboardShortcuts: boolean
}

// 标签页搜索结果
export interface TabSearchResult {
  tabs: Tab[]
  query: string
  totalCount: number
}

// 创建书签请求
export interface CreateBookmarkRequest {
  title: string
  url: string
  tags?: string[]
  description?: string
}

// 更新书签请求
export interface UpdateBookmarkRequest {
  title?: string
  url?: string
  tags?: string[]
  description?: string
}
