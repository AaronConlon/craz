import { BetweenHorizontalStart, Bookmark, Component, SlidersHorizontal, User } from 'lucide-react'
import { useState, Suspense } from 'react'
import { toast } from 'sonner'
import { useFaviconDockItems } from '../hooks/use-favicon-dock-items'
import type { FaviconDockItem } from '../utils/favicon-dock-items'
import { cn } from '../utils/cn'
import { Favicon } from './favicon'
import { DockItemMenu } from './dock-item-menu'

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
 * 高级 Dock 组件内部实现
 * 左侧：功能菜单 (设置、标签页、用户书签、团队书签)
 * 右侧：固定的 favicon 书签 (同步到 Google 账户)
 */
function AdvancedDockContent({
  className,
  activeView,
  onViewChange,
}: AdvancedDockProps) {
  const {
    items: faviconDockItems,
    updateLastUsed,
    removeItem,
    updateItem,
    reorderItems
  } = useFaviconDockItems()

  // 右键菜单状态
  const [menuState, setMenuState] = useState<{
    isOpen: boolean
    item: FaviconDockItem | null
    position: { x: number; y: number }
  }>({
    isOpen: false,
    item: null,
    position: { x: 0, y: 0 }
  })

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

  // 处理右键点击
  const handleFaviconContextMenu = (event: React.MouseEvent, item: FaviconDockItem) => {

    // 获取容器位置，计算相对坐标
    const containerElement = event.currentTarget.closest('[data-dock-container]') as HTMLElement
    const containerRect = containerElement?.getBoundingClientRect()

    let x = event.clientX
    let y = event.clientY

    // 如果找到了 dock 容器，转换为相对坐标
    if (containerRect) {
      x = event.clientX - containerRect.left
      y = event.clientY - containerRect.top
    }

    setMenuState({
      isOpen: true,
      item,
      position: { x, y }
    })
    event.preventDefault()
    event.stopPropagation()
  }

  // 关闭菜单
  const handleCloseMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }))
  }

  // 处理菜单操作
  const handleMenuAction = async (action: string, item: FaviconDockItem, data?: any) => {
    try {
      switch (action) {
        case 'delete':
          const success = await removeItem(item.id)
          if (success) {
            toast.success('已删除快捷栏项目')
          } else {
            toast.error('删除失败')
          }
          break

        case 'move-left': {
          const currentIndex = faviconDockItems.findIndex(i => i.id === item.id)
          if (currentIndex > 0) {
            const newOrder = [...faviconDockItems]
            const [movedItem] = newOrder.splice(currentIndex, 1)
            newOrder.splice(currentIndex - 1, 0, movedItem)

            const itemIds = newOrder.map(i => i.id)
            const success = await reorderItems(itemIds)
            if (success) {
              toast.success('已向左移动')
            } else {
              toast.error('移动失败')
            }
          }
          break
        }

        case 'move-right': {
          const currentIndex = faviconDockItems.findIndex(i => i.id === item.id)
          if (currentIndex < faviconDockItems.length - 1) {
            const newOrder = [...faviconDockItems]
            const [movedItem] = newOrder.splice(currentIndex, 1)
            newOrder.splice(currentIndex + 1, 0, movedItem)

            const itemIds = newOrder.map(i => i.id)
            const success = await reorderItems(itemIds)
            if (success) {
              toast.success('已向右移动')
            } else {
              toast.error('移动失败')
            }
          }
          break
        }

        case 'set-icon-data': {
          if (data?.newIcon) {
            const success = await updateItem(item.id, { favicon: data.newIcon })
            if (success) {
              toast.success('图标已更新')
            } else {
              toast.error('更新图标失败')
            }
          }
          break
        }

        default:
          console.warn('Unknown dock menu action:', action)
      }
    } catch (error) {
      console.error('Dock menu action failed:', error)
      toast.error('操作失败')
    }
  }

  // 计算移动能力
  const getMovementCapability = (item: FaviconDockItem) => {
    const currentIndex = faviconDockItems.findIndex(i => i.id === item.id)
    return {
      canMoveLeft: currentIndex > 0,
      canMoveRight: currentIndex < faviconDockItems.length - 1
    }
  }

  return (
    <div className={cn("flex relative justify-center animate-fade-up", className)} data-dock-container>
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
        {
          faviconDockItems?.length ? (
            <div className="mx-2 w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          ) : null
        }

        {/* 右侧固定 favicon */}
        <div className="flex gap-1 items-center">
          {faviconDockItems.map((item) => (
            <FaviconDockItem
              key={item.id}
              item={item}
              onClick={() => handleFaviconClick(item)}
              onContextMenu={(e) => handleFaviconContextMenu(e, item)}
            />
          ))}
        </div>
      </div>

      {/* 右键菜单 */}
      {menuState.item && (
        <DockItemMenu
          isOpen={menuState.isOpen}
          onClose={handleCloseMenu}
          item={menuState.item}
          position={menuState.position}
          onAction={handleMenuAction}
          {...getMovementCapability(menuState.item)}
        />
      )}
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
        "hover:bg-theme-primary-50 hover:scale-105",
        active && "bg-theme-primary-50 scale-105"
      )}     
    >
      <div className={cn('relative', active && 'text-theme-primary-500')}>
        {isProfileIcon ? (
          <User
            size={24}
            className={cn(
              "transition-colors duration-200",
            )}
          />
        ) : (
          item.icon
        )}
      </div>
      {/* hover 显示 popup title */}
      <div className={cn(
        "absolute -top-10 left-1/2 px-2 py-1 text-xs whitespace-nowrap rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100",
        // 浅色模式
        "bg-gray-800 text-white",
        // 深色模式
        "dark:bg-gray-700 dark:text-gray-100"
      )}>
        {item.label}
      </div>
    </button>
  )
}

interface FaviconDockItemProps {
  item: FaviconDockItem
  onClick: () => void
  onContextMenu: (event: React.MouseEvent) => void
}

function FaviconDockItem({ item, onClick, onContextMenu }: FaviconDockItemProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="flex relative justify-center items-center p-1.5 rounded-xl transition-all duration-200 group hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
    >
      <Favicon
        src={item.favicon}
        alt={item.title}
        size={16}
        className="rounded-lg"
      />

      {/* 悬停提示 */}
      <div className={cn(
        "absolute -top-10 left-1/2 px-2 py-1 text-xs whitespace-nowrap rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100",
        // 浅色模式
        "bg-gray-800 text-white",
        // 深色模式
        "dark:bg-gray-700 dark:text-gray-100"
      )}>
        {item.title}
      </div>
    </button>
  )
}

// 加载状态组件
function AdvancedDockFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center animate-fade-up", className)}>
      <div className="flex gap-3 items-center px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
        {/* 左侧功能菜单骨架 */}
        <div className="flex gap-1 items-center">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800"
            />
          ))}
        </div>

        {/* 分隔线 */}
        <div className="mx-2 w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

        {/* 右侧 favicon 骨架 */}
        <div className="flex gap-1 items-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-8 h-8 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 高级 Dock 组件
 * 使用 Suspense 包装，支持数据加载状态
 */
export function AdvancedDock(props: AdvancedDockProps) {
  return (
    <Suspense fallback={<AdvancedDockFallback className={props.className} />}>
      <AdvancedDockContent {...props} />
    </Suspense>
  )
}