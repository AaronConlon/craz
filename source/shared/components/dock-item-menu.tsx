import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  type LucideIcon,
  Trash2
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '~source/shared/utils'
import type { FaviconDockItem } from '../utils/favicon-dock-items'
import { useContainerRef } from './container-provider'

export interface DockItemMenuProps {
  isOpen: boolean
  onClose: () => void
  item: FaviconDockItem | null
  position: { x: number; y: number }
  onAction: (action: string, item: FaviconDockItem, data?: any) => void
  canMoveLeft: boolean
  canMoveRight: boolean
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
 * DockItemMenu - 快捷栏项目右键上下文菜单组件
 * 
 * 功能：
 * - 右键点击快捷栏项目时显示上下文菜单
 * - 支持删除、左右移动、设置图标等操作
 * - 点击外部区域自动关闭
 * - 完整的深色模式和主题色支持
 * 
 * 设计原则：
 * - 渐变背景与整体设计一致
 * - 清晰的操作分组和分隔线
 * - 直观的图标和文字说明
 * - 危险操作使用红色标识
 */
export function DockItemMenu({
  isOpen,
  onClose,
  item,
  position,
  onAction,
  canMoveLeft,
  canMoveRight
}: DockItemMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useContainerRef()

  // 菜单项定义
  const menuItems: MenuItem[] = [
    {
      id: 'move-left',
      label: '向左移动',
      icon: ArrowLeft,
      action: 'move-left',
      disabled: !canMoveLeft
    },
    {
      id: 'move-right',
      label: '向右移动',
      icon: ArrowRight,
      action: 'move-right',
      disabled: !canMoveRight
    },
    {
      id: 'divider-1',
      label: '',
      icon: ImageIcon, // 这里不会显示，只是为了满足类型
      action: '',
      divider: true
    },
    {
      id: 'set-icon',
      label: '设置图标',
      icon: ImageIcon,
      action: 'set-icon',
      variant: 'primary'
    },
    {
      id: 'divider-2',
      label: '',
      icon: ImageIcon,
      action: '',
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: Trash2,
      action: 'delete',
      variant: 'danger'
    }
  ]

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      // 监听全局容器的事件
      const globalContainer = containerRef.current
      if (globalContainer) {
        globalContainer.addEventListener('mousedown', handleClickOutside)
        globalContainer.addEventListener('keydown', handleEscape)

        return () => {
          globalContainer.removeEventListener('mousedown', handleClickOutside)
          globalContainer.removeEventListener('keydown', handleEscape)
        }
      }
    }
  }, [isOpen, onClose])

  // 处理菜单项点击
  const handleMenuItemClick = (menuItem: MenuItem) => {
    if (menuItem.disabled || menuItem.divider || !item) return

    if (menuItem.action === 'set-icon') {
      // 触发文件选择器
      fileInputRef.current?.click()
      return
    }

    try {
      onAction(menuItem.action, item)
      onClose()
    } catch (error) {
      console.error('Dock item menu action failed:', error)
      toast.error('操作失败')
    }
  }

  // 处理图标文件选择
  const handleIconFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !item) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小 (限制为 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片文件大小不能超过 2MB')
      return
    }

    // 转换为 base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      if (base64) {
        try {
          onAction('set-icon-data', item, { newIcon: base64 })
          onClose()
        } catch (error) {
          console.error('设置图标失败:', error)
          toast.error('设置图标失败')
        }
      }
    }
    reader.onerror = () => {
      toast.error('读取图片文件失败')
    }
    reader.readAsDataURL(file)

    // 清空文件选择器
    event.target.value = ''
  }

  // 计算菜单位置，确保不超出屏幕边界
  const getMenuStyle = () => {
    if (!isOpen) return { display: 'none' }

    const menuWidth = 180
    const menuHeight = menuItems.filter(item => !item.divider).length * 40 +
      menuItems.filter(item => item.divider).length * 9 + 16 // padding

    let { x, y } = position

    // x 值设置为鼠标右键位置再加上 10px
    x = x + 10

    // 获取 dock 容器尺寸
    const dockContainer = document.querySelector('[data-dock-container]') as HTMLElement
    const containerWidth = dockContainer?.offsetWidth || window.innerWidth
    const containerHeight = dockContainer?.offsetHeight || window.innerHeight



    // 确保菜单不超出右边界
    if (x + menuWidth > containerWidth) {
      x = containerWidth - menuWidth - 10
    }

    // 确保菜单不超出下边界
    if (y + menuHeight > containerHeight) {
      y = containerHeight - menuHeight - 10
    }

    // 确保菜单不超出上边界
    y = Math.max(10, y)

    // 确保菜单不超出左边界
    x = Math.max(10, x)

    const finalStyle = {
      position: 'absolute' as const,
      left: x,
      top: y,
      zIndex: 9999,
      transform: 'translate(0%, -50%)'
    }



    return finalStyle
  }

  if (!isOpen || !item) return null

  return (
    <>
      {/* 主菜单 */}
      <div
        ref={menuRef}
        style={getMenuStyle()}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
        className={cn(
          // 基础样式
          "min-w-[180px] py-2 rounded-lg shadow-lg border backdrop-blur-sm",
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
          快捷栏操作
        </div>

        {/* 菜单项列表 */}
        <div className="py-1">
          {menuItems.map((menuItem) => {
            if (menuItem.divider) {
              return (
                <div
                  key={menuItem.id}
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

            const Icon = menuItem.icon

            return (
              <button
                key={menuItem.id}
                onClick={() => handleMenuItemClick(menuItem)}
                disabled={menuItem.disabled}
                className={cn(
                  // 基础样式
                  "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-all duration-150",
                  // 浅色模式
                  "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100",
                  // 深色模式
                  "dark:text-gray-300 dark:hover:bg-gradient-to-r dark:hover:from-gray-700 dark:hover:to-gray-600",
                  // 主要操作样式
                  menuItem.variant === 'primary' && [
                    "text-theme-primary-700 hover:bg-gradient-to-r hover:from-theme-primary-50 hover:to-theme-primary-100",
                    "dark:text-theme-primary-300 dark:hover:from-theme-primary-950 dark:hover:to-theme-primary-900"
                  ],
                  // 危险操作样式
                  menuItem.variant === 'danger' && [
                    "text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100",
                    "dark:text-red-400 dark:hover:from-red-950 dark:hover:to-red-900"
                  ],
                  // 禁用状态
                  menuItem.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "flex-shrink-0",
                    menuItem.variant === 'primary' && "text-theme-primary-600 dark:text-theme-primary-400",
                    menuItem.variant === 'danger' && "text-red-500 dark:text-red-400"
                  )}
                />
                <span className="flex-1">{menuItem.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleIconFileChange}
      />
    </>
  )
} 