import { User } from 'lucide-react'
import { FcBookmark, FcConferenceCall, FcSettings, FcViewDetails } from 'react-icons/fc'
import { useFaviconBookmarks, type FaviconBookmark } from '../hooks/use-chrome-storage'
import { cn } from '../utils'
import { Favicon } from './favicon'

export type ViewMode = 'tabs' | 'user-bookmarks' | 'team-bookmarks' | 'settings' | 'profile'

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
      id: 'profile' as ViewMode,
      label: '个人资料',
      icon: <User size={24} />,
      onClick: () => onViewChange('profile')
    },
    {
      id: 'tabs' as ViewMode,
      label: '标签页',
      icon: <FcViewDetails size={24} />,

      onClick: () => onViewChange('tabs')
    },
    {
      id: 'user-bookmarks' as ViewMode,
      label: '个人书签',
      icon: <FcBookmark size={24} />,
      onClick: () => onViewChange('user-bookmarks')
    },
    {
      id: 'team-bookmarks' as ViewMode,
      label: '团队书签',
      icon: <FcConferenceCall size={24} />,
      onClick: () => onViewChange('team-bookmarks')
    }
  ]

  const handleFaviconClick = (bookmark: FaviconBookmark) => {
    // 在新标签页中打开链接
    window.open(bookmark.url, '_blank')
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex gap-3 items-center px-4 py-2 bg-white rounded-2xl border shadow-lg backdrop-blur-md">
        {/* 左侧功能菜单 */}
        <div className="flex gap-1 items-center">
          {leftMenuItems.map((item) => (
            <DockMenuItem
              key={item.id}
              item={item}
              active={activeView === item.id}
            />
          ))}
        </div>

        {/* 分隔线 */}
        <div className="mx-2 w-px h-6 bg-gray-300"></div>

        {/* 右侧固定 favicon */}
        <div className="flex gap-1 items-center">

          {/* 提供 dark mode 切换的功能，点击图标，弹出 popup 菜单选择 dark mode */}

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
        {/* {typeof item.count === 'number' && item.count > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {item.count > 99 ? '99+' : item.count}
          </div>
        )} */}

        {/* 活动指示器 */}
        {active && (
          <div className="absolute bottom-[-2px] left-1/2 w-1 h-1 bg-gray-600 rounded-full transform -translate-x-1/2" />
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
      className="flex relative justify-center items-center p-2 rounded-xl transition-all duration-200 group hover:bg-white/60 hover:scale-105 hover:shadow-md"
      title={bookmark.title}
    >
      <Favicon
        src={bookmark.favIconUrl}
        alt={bookmark.title}
        size={20}
        className="rounded-lg"
      />

      {/* 悬停提示 */}
      <div className="absolute -top-10 left-1/2 px-2 py-1 text-xs text-white whitespace-nowrap bg-gray-800 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        {bookmark.title}
      </div>
    </button>
  )
} 