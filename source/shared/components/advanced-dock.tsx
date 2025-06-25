import { BetweenHorizontalStart, Bookmark, Component, SlidersHorizontal, User } from 'lucide-react'
import { useFaviconDockItems } from '../hooks/use-favicon-dock-items'
import type { FaviconDockItem } from '../utils/favicon-dock-items'
import { cn } from '../utils/cn'
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
  const { items: faviconDockItems, loading, updateLastUsed } = useFaviconDockItems()

  const leftMenuItems = [
    {
      id: 'settings' as ViewMode,
      label: '设置',
      icon: <SlidersHorizontal size={24} />,
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
      icon: <BetweenHorizontalStart size={24} />,
      onClick: () => onViewChange('tabs')
    },
    {
      id: 'user-bookmarks' as ViewMode,
      label: '个人书签',
      icon: <Bookmark size={24} />,
      onClick: () => onViewChange('user-bookmarks')
    },
    {
      id: 'team-bookmarks' as ViewMode,
      label: '团队书签',
      icon: <Component size={24} />,
      onClick: () => onViewChange('team-bookmarks')
    }
  ]

  const handleFaviconClick = async (item: FaviconDockItem) => {
    // 更新最后使用时间
    await updateLastUsed(item.id)
    // 在新标签页中打开链接
    window.open(item.url, '_blank')
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex gap-3 items-center px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
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
        <div className="mx-2 w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

        {/* 右侧固定 favicon */}
        <div className="flex gap-1 items-center">
          {loading ? (
            // 加载状态
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800"
              />
            ))
          ) : (
              faviconDockItems.map((item) => (
              <FaviconDockItem
                  key={item.id}
                  item={item}
                  onClick={() => handleFaviconClick(item)}
              />
            ))
          )}
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
  // 为个人资料图标特殊处理，使用主题色
  const isProfileIcon = item.id === 'profile'

  return (
    <button
      onClick={item.onClick}
      className={cn(
        "relative flex items-center justify-center p-2 rounded-xl transition-all duration-200 group",
        "hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105",
        active && "bg-gray-100 dark:bg-gray-800 scale-105"
      )}
      title={item.label}
    >
      <div className="relative">
        {isProfileIcon ? (
          <User
            size={24}
            className={cn(
              "transition-colors duration-200",
              active
                ? "text-theme-primary-500 dark:text-theme-primary-400"
                : "text-gray-600 dark:text-gray-400"
            )}
          />
        ) : (
          item.icon
        )}
      </div>
    </button>
  )
}

interface FaviconDockItemProps {
  item: FaviconDockItem
  onClick: () => void
}

function FaviconDockItem({ item, onClick }: FaviconDockItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex relative justify-center items-center p-1.5 rounded-xl transition-all duration-200 group hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
      title={item.title}
    >
      <Favicon
        src={item.favicon}
        alt={item.title}
        size={18}
        className="rounded-lg"
      />

      {/* 悬停提示 */}
      <div className="absolute -top-10 left-1/2 px-2 py-1 text-xs text-white whitespace-nowrap bg-gray-800 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-100">
        {item.title}
      </div>
    </button>
  )
} 