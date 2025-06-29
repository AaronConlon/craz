import {
  Archive,
  Bookmark,
  Copy,
  ExternalLink,
  EyeOff,
  type LucideIcon,
  Pin,
  PinOff,
  RotateCcw,
  Share,
  Star,
  Trash2,
  Users,
  Twitter,
  Hash,
  ChevronRight
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '~source/shared/utils'
import type { Tab } from '../types'
import { useContainerRef } from '~source/shared/components/container-provider'

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
  icon: LucideIcon | null
  action: string
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
  divider?: boolean
  children?: MenuItem[]
}

interface SubMenuState {
  isOpen: boolean
  parentId: string | null
  position: { x: number; y: number }
}

/**
 * TabMenu - 标签页右键上下文菜单组件
 * 
 * 功能：
 * - 右键点击标签页时显示上下文菜单
 * - 根据标签页类型（当前/历史）显示不同的菜单项
 * - 支持多种操作：书签、固定、关闭、复制等
 * - 支持子菜单功能
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
  const subMenuRef = useRef<HTMLDivElement>(null)
  const [subMenuState, setSubMenuState] = useState<SubMenuState>({
    isOpen: false,
    parentId: null,
    position: { x: 0, y: 0 }
  })
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mainMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const containerRef = useContainerRef()
  const queryClient = useQueryClient()

  // 从缓存中获取快捷栏数据
  const dockItemsResponse = queryClient.getQueryData(["favicon-dock-items"]) as any
  const dockItems = dockItemsResponse?.items || []

  // 检查是否已在快捷栏中
  const isInDock = tab ? dockItems.some((item: any) => item.url === tab.url) : false

  // 当前标签页的菜单项
  const currentTabMenuItems: MenuItem[] = [
    {
      id: 'share-website',
      label: '分享网站',
      icon: Share,
      action: '',
      children: [
        {
          id: 'share-website-copy-url',
          label: '复制标题和网址',
          icon: Copy,
          action: 'share-website-copy-url'
        },
        {
          id: 'share-website-copy-markdown',
          label: '复制 Markdown 链接',
          icon: Hash,
          action: 'share-website-copy-markdown'
        },
        {
          id: 'share-website-to-x',
          label: '分享到 X',
          icon: Twitter,
          action: 'share-website-to-x'
        }
      ]
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
      label: '添加到 Craz 书签',
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
      label: isInDock ? '已在快捷栏中' : '添加到快捷栏',
      icon: Star,
      action: 'add-to-dock',
      disabled: isInDock
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
    }
  ]

  // 历史记录的菜单项
  const historyMenuItems: MenuItem[] = [
    {
      id: 'share-website',
      label: '分享网站',
      icon: Share,
      action: '',
      children: [
        {
          id: 'share-website-copy-url',
          label: '复制标题和网址',
          icon: Copy,
          action: 'share-website-copy-url'
        },
        {
          id: 'share-website-copy-markdown',
          label: '复制 Markdown 链接',
          icon: Hash,
          action: 'share-website-copy-markdown'
        },
        {
          id: 'share-website-to-x',
          label: '分享到 X',
          icon: Twitter,
          action: 'share-website-to-x'
        }
      ]
    },
    {
      id: 'divider-1',
      label: '',
      icon: null,
      action: '',
      divider: true
    },
    {
      id: 'add-to-dock',
      label: isInDock ? '已在快捷栏中' : '添加到快捷栏',
      icon: Star,
      action: 'add-to-dock',
      variant: 'primary',
      disabled: isInDock
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
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target) &&
        subMenuRef.current && !subMenuRef.current.contains(target)) {
        onClose()
        setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (subMenuState.isOpen) {
          setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      containerRef.current?.addEventListener('mousedown', handleClickOutside)
      containerRef.current?.addEventListener('keydown', handleEscape)

      return () => {
        containerRef.current?.removeEventListener('mousedown', handleClickOutside)
        containerRef.current?.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose, subMenuState.isOpen])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (mainMenuCloseTimeoutRef.current) {
        clearTimeout(mainMenuCloseTimeoutRef.current)
      }
    }
  }, [])

  // 处理菜单项悬停
  const handleMenuItemHover = (item: MenuItem, event: React.MouseEvent) => {
    if (item.disabled || item.divider || !tab) return

    // 清除之前的定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // 如果有子菜单且没有 action，显示子菜单
    if (item.children && item.children.length > 0 && !item.action) {
      const rect = event.currentTarget.getBoundingClientRect()
      setSubMenuState({
        isOpen: true,
        parentId: item.id,
        position: {
          x: rect.right + 5,
          y: rect.top
        }
      })
    } else {
      // 没有子菜单的项目，隐藏子菜单
      setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
    }
  }

  // 处理鼠标离开菜单项
  const handleMenuItemLeave = () => {
    // 添加延迟隐藏，给用户时间移动到子菜单
    hoverTimeoutRef.current = setTimeout(() => {
      setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
    }, 150)
  }

  // 处理子菜单悬停
  const handleSubMenuHover = () => {
    // 鼠标进入子菜单时，清除隐藏定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    // 同时取消主菜单的关闭定时器
    if (mainMenuCloseTimeoutRef.current) {
      clearTimeout(mainMenuCloseTimeoutRef.current)
      mainMenuCloseTimeoutRef.current = null
    }
  }

  // 处理子菜单离开
  const handleSubMenuLeave = () => {
    // 鼠标离开子菜单时，隐藏子菜单
    hoverTimeoutRef.current = setTimeout(() => {
      setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
    }, 150)
  }

  // 处理主菜单鼠标离开
  const handleMainMenuLeave = () => {
    // 设置延迟关闭整个菜单
    mainMenuCloseTimeoutRef.current = setTimeout(() => {
      onClose()
      setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
    }, 150)
  }

  // 处理菜单项点击
  const handleMenuItemClick = (item: MenuItem, event?: React.MouseEvent) => {
    if (item.disabled || item.divider || !tab) return

    // 只处理有 action 的项目
    if (item.action) {
      try {
        onAction(item.action, tab)
        onClose()
        setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
      } catch (error) {
        console.error('Menu action failed:', error)
        toast.error('操作失败')
      }
    }
  }

  // 计算菜单位置，确保不超出屏幕边界
  const getMenuStyle = () => {
    if (!isOpen) return { display: 'none' }

    const menuWidth = 220
    const menuHeight = menuItems.filter(item => !item.divider).length * 40 +
      menuItems.filter(item => item.divider).length * 9 + 16 // padding

    let { x, y } = position

    // x 值设置为外层 div 的右边边框再加上 10px
    x = x + 10

    // 确保菜单不超出右边界
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // 确保菜单不超出下边界（考虑 transform 向上偏移 50%）
    if (y + menuHeight / 2 > window.innerHeight) {
      y = window.innerHeight - menuHeight / 2 - 10
    }

    // 确保菜单不超出上边界（考虑 transform 向上偏移 50%）
    if (y - menuHeight / 2 < 10) {
      y = menuHeight / 2 + 10
    }

    // 确保菜单不超出左边界
    x = Math.max(10, x)

    return {
      position: 'fixed' as const,
      left: x,
      top: y,
      transform: 'translateY(-50%)',
      zIndex: 9999
    }
  }

  // 计算子菜单位置
  const getSubMenuStyle = () => {
    if (!subMenuState.isOpen) return { display: 'none' }

    const subMenuItems = menuItems.find(item => item.id === subMenuState.parentId)?.children || []
    const subMenuWidth = 240
    const subMenuHeight = subMenuItems.length * 40 + 16

    let { x, y } = subMenuState.position

    // 确保子菜单不超出右边界
    if (x + subMenuWidth > window.innerWidth) {
      x = subMenuState.position.x - subMenuWidth - 10 // 显示在左侧
    }

    // 确保子菜单不超出下边界
    if (y + subMenuHeight > window.innerHeight) {
      y = window.innerHeight - subMenuHeight - 10
    }

    // 确保子菜单不超出上边界
    y = Math.max(10, y)

    return {
      position: 'fixed' as const,
      left: x,
      top: y,
      zIndex: 10000
    }
  }

  if (!isOpen || !tab) return null

  const currentSubMenuItems = subMenuState.parentId
    ? menuItems.find(item => item.id === subMenuState.parentId)?.children
    : []

  return (
    <>
      {/* 主菜单 */}
      <div
        ref={menuRef}
        style={getMenuStyle()}
        onMouseEnter={() => {
          // 鼠标进入主菜单时，清除隐藏定时器
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
          }
          // 清除主菜单关闭定时器
          if (mainMenuCloseTimeoutRef.current) {
            clearTimeout(mainMenuCloseTimeoutRef.current)
            mainMenuCloseTimeoutRef.current = null
          }
        }}
        onMouseLeave={handleMainMenuLeave}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
        className={cn(
          // 基础样式
          "min-w-[220px] py-2 rounded-lg shadow-lg border backdrop-blur-sm max-w-[320px]",
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
            const hasChildren = item.children && item.children.length > 0

            return (
              <button
                key={item.id}
                onClick={(e) => handleMenuItemClick(item, e)}
                onMouseEnter={(e) => handleMenuItemHover(item, e)}
                onMouseLeave={handleMenuItemLeave}
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
                {hasChildren && (
                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 子菜单 */}
      {subMenuState.isOpen && currentSubMenuItems && (
        <div
          ref={subMenuRef}
          style={getSubMenuStyle()}
          onMouseEnter={handleSubMenuHover}
          onMouseLeave={handleSubMenuLeave}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
          }}
          className={cn(
            // 基础样式
            "min-w-[240px] py-2 rounded-lg shadow-lg border backdrop-blur-sm",
            // 浅色模式渐变背景
            "bg-gradient-to-bl from-white to-gray-50 border-gray-200",
            // 深色模式渐变背景
            "dark:bg-gradient-to-bl dark:from-gray-800 dark:to-gray-900 dark:border-gray-700",
            // 动画效果
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
        >
          {/* 子菜单项列表 */}
          <div className="py-1">
            {currentSubMenuItems.map((item) => {
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
                  {
                    Icon && (
                      <Icon
                        size={16}
                        className={cn(
                          "flex-shrink-0",
                          item.variant === 'primary' && "text-theme-primary-600 dark:text-theme-primary-400",
                          item.variant === 'danger' && "text-red-500 dark:text-red-400"
                        )}
                      />
                    )
                  }
                  <span className="flex-1">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
