import { FcSettings, FcViewDetails, FcBookmark, FcConferenceCall } from 'react-icons/fc'
import { Favicon } from './favicon'
import { useFaviconBookmarks, type FaviconBookmark } from '../hooks/use-chrome-storage'
import { cn } from '../utils'

export type ViewMode = 'tabs' | 'user-bookmarks' | 'team-bookmarks' | 'settings'

interface AdvancedDockProps {
  className?: string
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
  tabCount?: number
  userBookmarkCount?: number
  teamBookmarkCount?: number
}

/**
 * 高级 Dock 组件
 * 左侧：功能菜单 (设置、标签页、用户书签、团队书签)
 * 右侧：固定的 favicon 书签 (同步到 Google 账户)
 */
export function AdvancedDock({
  className,
  activeView,
  onViewChange,
  tabCount = 0,
  userBookmarkCount = 0,
  teamBookmarkCount = 0
}: AdvancedDockProps) {
  const { bookmarks: faviconBookmarks, loading } = useFaviconBookmarks()

  const leftMenuItems = [
    {
      id: 'settings' as ViewMode,
      label: '设置',
      icon: <FcSettings size={24} />,
      onClick: () => onViewChange('settings')
    },
    {
      id: 'tabs' as ViewMode,
      label: '标签页',
      icon: <FcViewDetails size={24} />,
      count: tabCount,
      onClick: () => onViewChange('tabs')
    },
    {
      id: 'user-bookmarks' as ViewMode,
      label: '个人书签',
      icon: <FcBookmark size={24} />,
      count: userBookmarkCount,
      onClick: () => onViewChange('user-bookmarks')
    },
    {
      id: 'team-bookmarks' as ViewMode,
      label: '团队书签',
      icon: <FcConferenceCall size={24} />,
      count: teamBookmarkCount,
      onClick: () => onViewChange('team-bookmarks')
    }
  ]

  const handleFaviconClick = (bookmark: FaviconBookmark) => {
    // 在新标签页中打开链接
    window.open(bookmark.url, '_blank')
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex items-center gap-3 px-4 py-2 border shadow-lg rounded-2xl backdrop-blur-md bg-gray-100/95 border-gray-200/50">
        {/* 左侧功能菜单 */}
        <div className="flex items-center gap-1">
          {leftMenuItems.map((item) => (
            <DockMenuItem
              key={item.id}
              item={item}
              active={activeView === item.id}
            />
          ))}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 mx-2 bg-gray-300"></div>

        {/* 右侧固定 favicon */}
        <div className="flex items-center gap-1">
          {/* {loading ? (
            // 加载状态
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="w-10 h-10 bg-gray-300 rounded-xl animate-pulse"
              />
            ))
          ) : (
            faviconBookmarks.map((bookmark) => (
              <FaviconDockItem
                key={bookmark.id}
                bookmark={bookmark}
                onClick={() => handleFaviconClick(bookmark)}
              />
            ))
          )} */}
        </div>
      </div>
    </div>
  )
}

interface DockMenuItemProps {
  item: {
    id: ViewMode
    label: string
    icon: React.ReactNode
    count?: number
    onClick: () => void
  }
  active: boolean
}

function DockMenuItem({ item, active }: DockMenuItemProps) {
  return (
    <button
      onClick={item.onClick}
      className={cn(
        "relative flex items-center justify-center p-1 rounded-xl transition-all duration-200 group",
        "hover:bg-white/60 hover:scale-105 hover:shadow-md",
        active && "bg-white/80 scale-105 shadow-md"
      )}
      title={item.label}
    >
      <div className="relative">
        {item.icon}

        {/* 数量标记 */}
        {typeof item.count === 'number' && item.count > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {item.count > 99 ? '99+' : item.count}
          </div>
        )}

        {/* 活动指示器 */}
        {active && (
          <div className="absolute w-1 h-1 transform -translate-x-1/2 bg-gray-600 rounded-full -bottom-4 left-1/2" />
        )}
      </div>

    </button>
  )
}

interface FaviconDockItemProps {
  bookmark: FaviconBookmark
  onClick: () => void
}

function FaviconDockItem({ bookmark, onClick }: FaviconDockItemProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center p-2 transition-all duration-200 rounded-xl group hover:bg-white/60 hover:scale-105 hover:shadow-md"
      title={bookmark.title}
    >
      <Favicon
        src={bookmark.favIconUrl}
        alt={bookmark.title}
        size={20}
        className="rounded-lg"
      />

      {/* 悬停提示 */}
      <div className="absolute px-2 py-1 text-xs text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-800 rounded opacity-0 pointer-events-none -top-10 left-1/2 group-hover:opacity-100 whitespace-nowrap">
        {bookmark.title}
      </div>
    </button>
  )
} 