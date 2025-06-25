import {
  Bookmark,
  Copy,
  ExternalLink,
  Pin,
  PinOff,
  Trash2,
  Users,
  Eye,
  EyeOff,
  RotateCcw,
  Star,
  Archive,
  type LucideIcon
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from '~source/shared/utils'
import type { Tab } from '../types'

export type TabMenuType = 'current' | 'history'

export interface TabMenuProps {
  isOpen: boolean
  onClose: () => void
  tab: Tab | null
  type: TabMenuType
  position: { x: number; y: number }
  onAction: (action: string, tab: Tab) => void
}

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  action: string
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
  divider?: boolean
}

/**
 * TabMenu - 标签页右键上下文菜单组件
 * 
 * 功能：
 * - 右键点击标签页时显示上下文菜单
 * - 根据标签页类型（当前/历史）显示不同的菜单项
 * - 支持多种操作：书签、固定、关闭、复制等
 * - 点击外部区域自动关闭
 * - 完整的深色模式和主题色支持
 * 
 * 设计原则：
 * - 渐变背景与整体设计一致
 * - 清晰的操作分组和分隔线
 * - 直观的图标和文字说明
 * - 危险操作使用红色标识
 */
export function TabMenu({
  isOpen,
  onClose,
  tab,
  type,
  position,
  onAction
}: TabMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 当前标签页的菜单项
  const currentTabMenuItems: MenuItem[] = [
    {
      id: 'copy-url',
      label: '复制链接',
      icon: Copy,
      action: 'copy-url'
    },
    {
      id: 'open-new-tab',
      label: '在新标签页中打开',
      icon: ExternalLink,
      action: 'open-new-tab'
    },
    {
      id: 'divider-1',
      label: '',
      icon: Copy,
      action: '',
      divider: true
    },
    {
      id: 'add-bookmark',
      label: '添加到书签',
      icon: Bookmark,
      action: 'add-bookmark',
      variant: 'primary'
    },
    {
      id: 'pin-tab',
      label: tab?.pinned ? '取消固定' : '固定标签页',
      icon: tab?.pinned ? PinOff : Pin,
      action: 'toggle-pin'
    },
    {
      id: 'add-to-dock',
      label: '添加到快捷栏',
      icon: Star,
      action: 'add-to-dock'
    },
    {
      id: 'divider-2',
      label: '',
      icon: Copy,
      action: '',
      divider: true
    },
    {
      id: 'add-to-team',
      label: '添加到团队',
      icon: Users,
      action: 'add-to-team'
    },
    {
      id: 'set-hidden-bookmark',
      label: '设为隐藏书签',
      icon: EyeOff,
      action: 'set-hidden-bookmark'
    },
    {
      id: 'divider-3',
      label: '',
      icon: Copy,
      action: '',
      divider: true
    },
    {
      id: 'close-tab',
      label: '关闭标签页',
      icon: Trash2,
      action: 'close-tab',
      variant: 'danger'
    }
  ]

  // 历史记录的菜单项
  const historyMenuItems: MenuItem[] = [
    {
      id: 'copy-url',
      label: '复制链接',
      icon: Copy,
      action: 'copy-url'
    },
    {
      id: 'open-new-tab',
      label: '在新标签页中打开',
      icon: ExternalLink,
      action: 'open-new-tab'
    },
    {
      id: 'divider-1',
      label: '',
      icon: Copy,
      action: '',
      divider: true
    },
    {
      id: 'add-to-dock',
      label: '添加到快捷栏',
      icon: Star,
      action: 'add-to-dock',
      variant: 'primary'
    },
    {
      id: 'restore-tab',
      label: '恢复标签页',
      icon: RotateCcw,
      action: 'restore-tab'
    },
    {
      id: 'divider-2',
      label: '',
      icon: Copy,
      action: '',
      divider: true
    },
    {
      id: 'exclude-from-stats',
      label: '从统计中排除',
      icon: Archive,
      action: 'exclude-from-stats'
    },
    {
      id: 'delete-history',
      label: '删除历史记录',
      icon: Trash2,
      action: 'delete-history',
      variant: 'danger'
    }
  ]

  const menuItems = type === 'current' ? currentTabMenuItems : historyMenuItems

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  // 处理菜单项点击
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.disabled || item.divider || !tab) return

    try {
      onAction(item.action, tab)
      onClose()
    } catch (error) {
      console.error('Menu action failed:', error)
      toast.error('操作失败')
    }
  }

  // 计算菜单位置，确保不超出屏幕边界
  const getMenuStyle = () => {
    if (!isOpen) return { display: 'none' }

    const menuWidth = 220
    const menuHeight = menuItems.filter(item => !item.divider).length * 40 +
      menuItems.filter(item => item.divider).length * 9 + 16 // padding

    let { x, y } = position

    // 确保菜单不超出右边界
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // 确保菜单不超出下边界
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    // 确保菜单不超出左边界和上边界
    x = Math.max(10, x)
    y = Math.max(10, y)

    return {
      position: 'fixed' as const,
      left: x,
      top: y,
      zIndex: 9999
    }
  }

  if (!isOpen || !tab) return null

  return (
    <div
      ref={menuRef}
      style={getMenuStyle()}
      className={cn(
        // 基础样式
        "min-w-[220px] py-2 rounded-lg shadow-lg border backdrop-blur-sm",
        // 浅色模式渐变背景
        "bg-gradient-to-bl from-white to-gray-50 border-gray-200",
        // 深色模式渐变背景
        "dark:bg-gradient-to-bl dark:from-gray-800 dark:to-gray-900 dark:border-gray-700",
        // 动画效果
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
    >
      {/* 菜单标题 */}
      <div className={cn(
        "px-3 py-2 text-xs font-medium border-b",
        // 浅色模式
        "text-gray-500 border-gray-100",
        // 深色模式
        "dark:text-gray-400 dark:border-gray-700"
      )}>
        {type === 'current' ? '标签页操作' : '历史记录操作'}
      </div>

      {/* 菜单项列表 */}
      <div className="py-1">
        {menuItems.map((item) => {
          if (item.divider) {
            return (
              <div
                key={item.id}
                className={cn(
                  "mx-2 my-1 border-t",
                  // 浅色模式
                  "border-gray-100",
                  // 深色模式
                  "dark:border-gray-700"
                )}
              />
            )
          }

          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item)}
              disabled={item.disabled}
              className={cn(
                // 基础样式
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-all duration-150",
                // 浅色模式
                "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100",
                // 深色模式
                "dark:text-gray-300 dark:hover:bg-gradient-to-r dark:hover:from-gray-700 dark:hover:to-gray-600",
                // 主要操作样式
                item.variant === 'primary' && [
                  "text-theme-primary-700 hover:bg-gradient-to-r hover:from-theme-primary-50 hover:to-theme-primary-100",
                  "dark:text-theme-primary-300 dark:hover:from-theme-primary-950 dark:hover:to-theme-primary-900"
                ],
                // 危险操作样式
                item.variant === 'danger' && [
                  "text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100",
                  "dark:text-red-400 dark:hover:from-red-950 dark:hover:to-red-900"
                ],
                // 禁用状态
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "flex-shrink-0",
                  item.variant === 'primary' && "text-theme-primary-600 dark:text-theme-primary-400",
                  item.variant === 'danger' && "text-red-500 dark:text-red-400"
                )}
              />
              <span className="flex-1">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* 菜单底部信息 */}
      <div className={cn(
        "px-3 py-2 text-xs border-t",
        // 浅色模式
        "text-gray-400 border-gray-100",
        // 深色模式
        "dark:text-gray-500 dark:border-gray-700"
      )}>
        {tab.title && (
          <div className="truncate" title={tab.title}>
            {tab.title}
          </div>
        )}
        {tab.url && (
          <div className="text-gray-400 truncate dark:text-gray-500" title={tab.url}>
            {tab.url}
          </div>
        )}
      </div>
    </div>
  )
}
