import { useState, useEffect } from 'react'
import {
  Bookmark,
  Users,
  Search,
  Filter,
  Calendar,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedCounter, EmptyState, Favicon } from '~source/components'
import { cn } from '~source/shared/utils'
import { useScrollDetection } from '~source/shared/hooks'
import {
  getCloudBookmarks,
  getTeamCloudBookmarks,
  deleteCloudBookmark,
  deleteTeamCloudBookmark
} from '~source/shared/api/messages'
import type { Bookmark as CloudBookmark } from '~source/shared/api/types'

interface BookmarksViewProps {
  mode: 'user' | 'team'
  teamId?: string
}

type DisplayMode = 'list' | 'grid'
type SortOrder = 'asc' | 'desc'
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year'

interface FilterOptions {
  dateFilter: DateFilter
  sortOrder: SortOrder
  displayMode: DisplayMode
}

export function BookmarksView({ mode, teamId }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = useState<CloudBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    dateFilter: 'all',
    sortOrder: 'desc',
    displayMode: 'list'
  })

  // 滚动检测
  const [scrollRef, isScrolling] = useScrollDetection<HTMLDivElement>(1500)

  useEffect(() => {
    loadBookmarks()
  }, [mode, teamId])

  const loadBookmarks = async () => {
    setLoading(true)
    try {
      let data: CloudBookmark[]
      if (mode === 'user') {
        data = await getCloudBookmarks()
      } else if (mode === 'team' && teamId) {
        data = await getTeamCloudBookmarks(teamId)
      } else {
        data = []
      }
      setBookmarks(data)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
      toast.error('加载书签失败')
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }

  // 过滤和排序书签
  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      // 搜索过滤
      const matchesSearch = !searchQuery ||
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // 日期过滤
      const now = Date.now()
      const bookmarkDate = new Date(bookmark.createdAt).getTime()
      let matchesDate = true

      switch (filters.dateFilter) {
        case 'today':
          matchesDate = now - bookmarkDate < 24 * 60 * 60 * 1000
          break
        case 'week':
          matchesDate = now - bookmarkDate < 7 * 24 * 60 * 60 * 1000
          break
        case 'month':
          matchesDate = now - bookmarkDate < 30 * 24 * 60 * 60 * 1000
          break
        case 'year':
          matchesDate = now - bookmarkDate < 365 * 24 * 60 * 60 * 1000
          break
        default:
          matchesDate = true
      }

      return matchesSearch && matchesDate
    })
    .sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime()
      const bDate = new Date(b.createdAt).getTime()
      return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    })

  const handleBookmarkClick = (bookmark: CloudBookmark) => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank')
    }
  }

  const handleDeleteBookmark = async (bookmark: CloudBookmark, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      if (mode === 'user') {
        await deleteCloudBookmark(bookmark.id)
      } else if (mode === 'team' && teamId) {
        await deleteTeamCloudBookmark(teamId, bookmark.id)
      }
      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id))
      toast.success('书签已删除')
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
      toast.error('删除书签失败')
    }
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 rounded-full border-2 border-theme-primary-500 animate-spin border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-1 border-b border-gray-100">
        <div className="flex gap-4 justify-between items-center py-2 w-full">
          {/* 左侧：图标和筛选按钮 */}
          <div className="flex flex-shrink-0 gap-2 items-center">
            {mode === 'user' ? (
              <Bookmark className="text-gray-700" size={20} />
            ) : (
              <Users className="text-gray-700" size={20} />
            )}

            {/* 筛选按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-1 bg-white rounded-full transition-all cursor-pointer hover:bg-gray-100",
                  showFilters ? "bg-gray-100 opacity-100" : "opacity-70 hover:opacity-100"
                )}
                title="筛选选项"
              >
                <Filter size={16} className="text-gray-600" />
              </button>

              {/* 筛选下拉菜单 */}
              {showFilters && (
                <div className="absolute left-0 top-full z-10 p-4 mt-2 space-y-4 w-64 bg-white rounded-lg border border-gray-200 shadow-lg">
                  {/* 日期筛选 */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      <Calendar size={14} className="inline mr-1" />
                      日期筛选
                    </label>
                    <select
                      value={filters.dateFilter}
                      onChange={(e) => updateFilter('dateFilter', e.target.value as DateFilter)}
                      className="p-2 w-full text-sm rounded-md border border-gray-300"
                    >
                      <option value="all">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">本周</option>
                      <option value="month">本月</option>
                      <option value="year">本年</option>
                    </select>
                  </div>

                  {/* 排序方式 */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      排序方式
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilter('sortOrder', 'desc')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 p-2 rounded-md text-sm transition-colors",
                          filters.sortOrder === 'desc'
                            ? "bg-theme-primary-100 text-theme-primary-700 border border-theme-primary-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <SortDesc size={14} />
                        最新
                      </button>
                      <button
                        onClick={() => updateFilter('sortOrder', 'asc')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 p-2 rounded-md text-sm transition-colors",
                          filters.sortOrder === 'asc'
                            ? "bg-theme-primary-100 text-theme-primary-700 border border-theme-primary-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <SortAsc size={14} />
                        最早
                      </button>
                    </div>
                  </div>

                  {/* 展示风格 */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      展示风格
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilter('displayMode', 'list')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 p-2 rounded-md text-sm transition-colors",
                          filters.displayMode === 'list'
                            ? "bg-theme-primary-100 text-theme-primary-700 border border-theme-primary-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <List size={14} />
                        列表
                      </button>
                      <button
                        onClick={() => updateFilter('displayMode', 'grid')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 p-2 rounded-md text-sm transition-colors",
                          filters.displayMode === 'grid'
                            ? "bg-theme-primary-100 text-theme-primary-700 border border-theme-primary-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <Grid3X3 size={14} />
                        卡片
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 中间：搜索框 */}
          <div className="flex relative flex-grow justify-center items-center mx-auto">
            <div className='bg-theme-primary-600 rounded-full left-[28px] p-[4px] relative'>
              <Search size={16} color='white' />
            </div>
            <input
              type="text"
              placeholder="搜索书签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-[420px] py-1.5 pl-10 text-gray-800 border border-transparent focus:border-gray-100 placeholder-gray-500 transition-all duration-200 rounded-full outline-none bg-gray-50 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 右侧：计数器 */}
          <div className="min-w-[96px] flex justify-end">
            <AnimatedCounter
              value={filteredBookmarks.length}
              className="flex-shrink-0 text-lg font-black tracking-tight text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* 书签列表 */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto scrollbar-macos-thin min-h-[320px]",
          isScrolling && "scrolling"
        )}
      >
        {filteredBookmarks.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <EmptyState
              title={searchQuery ? "未找到匹配的书签" : `暂无${mode === 'user' ? '个人' : '团队'}书签`}
              description={searchQuery ? "尝试使用不同的关键词" : "开始添加你的第一个书签"}
            />
          </div>
        ) : (
            <div className={cn(
              "p-4",
              filters.displayMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-2"
            )}>
              {filteredBookmarks.map((bookmark) => (
                <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                  displayMode={filters.displayMode}
                onClick={() => handleBookmarkClick(bookmark)}
                  onDelete={(e) => handleDeleteBookmark(bookmark, e)}
              />
              ))}
            </div>
        )}
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: CloudBookmark
  displayMode: DisplayMode
  onClick: () => void
  onDelete: (event: React.MouseEvent) => void
}

function BookmarkItem({ bookmark, displayMode, onClick, onDelete }: BookmarkItemProps) {
  if (displayMode === 'grid') {
    return (
      <div
        onClick={onClick}
        className="overflow-hidden bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer group hover:shadow-md"
      >
        {/* OG Image */}
        {bookmark.metadata?.ogImage && (
          <div className="overflow-hidden bg-gray-100 aspect-video">
            <img
              src={bookmark.metadata.ogImage}
              alt={bookmark.title}
              className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex gap-3 items-start mb-2">
            <Favicon
              src={bookmark.metadata?.favicon || bookmark.url}
              size={20}
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-800 truncate">
                {bookmark.metadata?.ogTitle || bookmark.title}
              </h3>
              {bookmark.url && (
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {new URL(bookmark.url).hostname}
                </p>
              )}
            </div>
            <div className="flex gap-1 items-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 transition-colors hover:text-red-500"
                title="删除书签"
              >
                <X size={14} />
              </button>
              <ExternalLink size={14} className="text-gray-400" />
            </div>
          </div>

          {(bookmark.metadata?.ogDescription || bookmark.metadata?.description) && (
            <p className="mb-2 text-xs text-gray-600 line-clamp-2">
              {bookmark.metadata?.ogDescription || bookmark.metadata?.description}
            </p>
          )}

          <div className="text-xs text-gray-400">
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    )
  }

  // List mode
  return (
    <div
      onClick={onClick}
      className="flex gap-3 items-center p-3 bg-white rounded-lg border border-transparent transition-colors cursor-pointer group hover:bg-gray-50 hover:border-gray-200"
    >
      <Favicon
        src={bookmark.metadata?.favicon || bookmark.url}
        size={20}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">
          {bookmark.metadata?.ogTitle || bookmark.title}
        </div>
        {bookmark.url && (
          <div className="text-xs text-gray-500 truncate">
            {bookmark.url}
          </div>
        )}
        {(bookmark.metadata?.ogDescription || bookmark.metadata?.description) && (
          <div className="mt-1 text-xs text-gray-600 truncate">
            {bookmark.metadata?.ogDescription || bookmark.metadata?.description}
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center text-xs text-gray-400">
        <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-1 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 transition-colors hover:text-red-500"
            title="删除书签"
          >
            <X size={14} />
          </button>
          <ExternalLink size={14} className="text-gray-400" />
        </div>
      </div>
    </div>
  )
}