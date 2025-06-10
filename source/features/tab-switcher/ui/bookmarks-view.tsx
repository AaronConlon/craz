import { useState, useEffect } from 'react'
import { Bookmark, Users, Search, Folder, ExternalLink } from 'lucide-react'
import { sendToBackground } from '@plasmohq/messaging'
import { Favicon } from '~source/components'

interface ChromeBookmark {
  id: string
  title: string
  url?: string
  children?: ChromeBookmark[]
  dateAdded?: number
  parentId?: string
}

interface BookmarksViewProps {
  mode: 'user' | 'team'
}

export function BookmarksView({ mode }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBookmarks()
  }, [mode])

  const loadBookmarks = async () => {
    setLoading(true)
    try {
      if (mode === 'user') {
        // 获取用户书签
        const response = await sendToBackground({
          name: 'get-bookmarks'
        })
        if (response.success) {
          setBookmarks(response.bookmarks || [])
        }
      } else {
        // 模拟团队书签 - 在实际项目中这里会连接团队书签服务
        setBookmarks([
          {
            id: 'team-1',
            title: '团队资源',
            children: [
              { id: 'team-1-1', title: '项目文档', url: 'https://docs.company.com' },
              { id: 'team-1-2', title: '设计系统', url: 'https://design.company.com' },
              { id: 'team-1-3', title: 'API 文档', url: 'https://api.company.com' }
            ]
          },
          {
            id: 'team-2',
            title: '常用工具',
            children: [
              { id: 'team-2-1', title: 'Figma', url: 'https://figma.com' },
              { id: 'team-2-2', title: 'Notion', url: 'https://notion.so' },
              { id: 'team-2-3', title: 'Linear', url: 'https://linear.app' }
            ]
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const flattenBookmarks = (bookmarks: ChromeBookmark[]): ChromeBookmark[] => {
    const result: ChromeBookmark[] = []

    const traverse = (items: ChromeBookmark[]) => {
      items.forEach(item => {
        if (item.url) {
          result.push(item)
        }
        if (item.children) {
          traverse(item.children)
        }
      })
    }

    traverse(bookmarks)
    return result
  }

  const filteredBookmarks = searchQuery
    ? flattenBookmarks(bookmarks).filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : bookmarks

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleBookmarkClick = (bookmark: ChromeBookmark) => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center min-h-[320px]">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
        <p className="text-gray-600">加载书签中...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-[320px]">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        {mode === 'user' ? (
          <Bookmark className="text-gray-700" size={24} />
        ) : (
          <Users className="text-gray-700" size={24} />
        )}
        <h2 className="text-xl font-bold text-gray-800">
          {mode === 'user' ? '个人书签' : '团队书签'}
        </h2>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
        <input
          type="text"
          placeholder="搜索书签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 transition-all duration-200 rounded-lg outline-none bg-gray-50"
        />
      </div>

      {/* 书签列表 */}
      <div className="space-y-2">
        {searchQuery ? (
          // 搜索结果：扁平列表
          filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onClick={() => handleBookmarkClick(bookmark)}
              />
            ))
          ) : (
              <div className="py-8 text-center text-gray-500">
              未找到匹配的书签
            </div>
          )
        ) : (
          // 正常结构：树形显示
          bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <BookmarkTreeItem
                key={bookmark.id}
                bookmark={bookmark}
                expanded={expandedFolders.has(bookmark.id)}
                onToggle={() => toggleFolder(bookmark.id)}
                onClick={() => handleBookmarkClick(bookmark)}
              />
            ))
          ) : (
                <div className="py-8 text-center text-gray-500">
              {mode === 'user' ? '暂无个人书签' : '暂无团队书签'}
            </div>
          )
        )}
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: ChromeBookmark
  onClick: () => void
  className?: string
}

function BookmarkItem({ bookmark, onClick, className = '' }: BookmarkItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group ${className}`}
    >
      <Favicon
        src={bookmark.url?.includes('chrome://') ? undefined : undefined}
        size={20}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{bookmark.title}</div>
        {bookmark.url && (
          <div className="text-sm text-gray-600 truncate">{bookmark.url}</div>
        )}
      </div>
      <ExternalLink
        size={16}
        className="text-gray-400 transition-opacity opacity-0 group-hover:opacity-100"
      />
    </button>
  )
}

interface BookmarkTreeItemProps {
  bookmark: ChromeBookmark
  expanded: boolean
  onToggle: () => void
  onClick: () => void
  level?: number
}

function BookmarkTreeItem({
  bookmark,
  expanded,
  onToggle,
  onClick,
  level = 0
}: BookmarkTreeItemProps) {
  const hasChildren = bookmark.children && bookmark.children.length > 0
  const isFolder = !bookmark.url && hasChildren

  if (isFolder) {
    return (
      <div>
        <button
          onClick={onToggle}
          className="flex items-center w-full gap-3 p-3 text-left transition-colors rounded-lg hover:bg-gray-50"
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <Folder
            size={20}
            className={`text-gray-600 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className="font-medium text-gray-800">{bookmark.title}</span>
          <span className="ml-auto text-sm text-gray-500">
            {bookmark.children?.length} 项
          </span>
        </button>

        {expanded && bookmark.children && (
          <div className="space-y-1">
            {bookmark.children.map((child) => (
              <BookmarkTreeItem
                key={child.id}
                bookmark={child}
                expanded={expanded}
                onToggle={() => { }}
                onClick={() => onClick()}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <BookmarkItem
      bookmark={bookmark}
      onClick={onClick}
      className={`ml-${level * 5}`}
    />
  )
} 