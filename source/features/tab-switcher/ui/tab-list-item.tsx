import { X } from 'lucide-react'
import { TabFavicon } from '~source/components'
import { cn } from '~source/shared/utils'
import type { Tab } from '../types'

interface TabListItemProps {
  tab: Tab
  onTabClick: (tab: Tab) => void
  onCloseTab: (tabId: number, event: React.MouseEvent) => void
  onDeleteHistory: (url: string) => void
  onContextMenu?: (tab: Tab, event: React.MouseEvent, type: 'current' | 'history') => void
  isClosing?: boolean
  className?: string
}

/**
 * TabListItem - 标签页列表项组件
 * 
 * 功能：
 * - 渲染单个标签页或历史记录项
 * - 支持点击切换/打开标签页
 * - 支持关闭标签页或删除历史记录
 * - 区分当前标签页和历史记录的显示样式
 * - 显示访问次数标识（历史记录）
 * 
 * 设计原则：
 * - 深色模式完全适配
 * - 悬停效果和交互反馈
 * - 禁用右键菜单和文本选择
 * - 响应式布局和文本截断
 */
export function TabListItem({
  tab,
  onTabClick,
  onCloseTab,
  onDeleteHistory,
  onContextMenu,
  isClosing = false,
  className
}: TabListItemProps) {
  // 判断是否为历史记录（id 为 -1）
  const isHistory = tab.id === -1

  // 获取访问次数（历史记录特有）
  const visitCount = isHistory ? (tab as any)._visitCount : null

  const handleClick = () => {
    onTabClick(tab)
  }

  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation()

    if (isHistory) {
      onDeleteHistory(tab.url!)
    } else {
      onCloseTab(tab.id!, event)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // 禁止默认右键菜单

    if (onContextMenu) {
      const type = isHistory ? 'history' : 'current'
      onContextMenu(tab, e, type)
    }
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        // 基础样式
        "p-3 transition-all duration-200 cursor-pointer select-none group",
        // 浅色模式悬停
        "hover:bg-gray-50 hover:border-l-2 hover:border-l-theme-primary-500",
        // 深色模式悬停
        "dark:hover:bg-gray-900 dark:hover:border-l-theme-primary-400",
        // 活跃状态（当前标签页）
        !isHistory && tab.active && [
          "bg-theme-primary-50 border-l-2 border-l-theme-primary-500",
          "dark:bg-theme-primary-950 dark:border-l-theme-primary-400"
        ],
        // 禁用状态
        isClosing && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex justify-between items-center">
        {/* 标签页信息 */}
        <div className="flex flex-1 items-center space-x-3 min-w-0">
          {/* Favicon */}
          <TabFavicon
            tab={tab}
            size={24}
            className="flex-shrink-0 rounded-full"
          />

          {/* 标题和URL */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 items-center">
              {/* 标题 */}
              <div className={cn(
                "text-sm font-medium truncate transition-colors",
                // 浅色模式
                "text-gray-900",
                // 深色模式
                "dark:text-white",
                // 当前活跃标签页强调色
                !isHistory && tab.active && "text-theme-primary-700 dark:text-theme-primary-300"
              )}>
                {tab.title}
              </div>

              {/* 标签页状态和历史记录标识 */}
              <div className="flex flex-shrink-0 gap-1 items-center">
                {/* 当前标签页标识 */}
                {!isHistory && tab.active && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    // 浅色模式
                    "bg-theme-primary-100 text-theme-primary-700",
                    // 深色模式
                    "dark:bg-theme-primary-900 dark:text-theme-primary-300"
                  )}>
                    当前
                  </span>
                )}

                {/* 历史记录标识 */}
                {isHistory && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    // 浅色模式
                    "bg-blue-100 text-blue-700",
                    // 深色模式
                    "dark:bg-blue-900 dark:text-blue-300"
                  )}>
                    历史
                  </span>
                )}

                {/* 访问次数 */}
                {isHistory && visitCount && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    // 浅色模式
                    "bg-gray-100 text-gray-600",
                    // 深色模式
                    "dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    {visitCount}次
                  </span>
                )}

                {/* 固定标签页标识 */}
                {!isHistory && tab.pinned && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    // 浅色模式
                    "bg-orange-100 text-orange-600",
                    // 深色模式
                    "dark:bg-orange-900 dark:text-orange-300"
                  )}>
                    固定
                  </span>
                )}
              </div>
            </div>

            {/* URL */}
            <div className={cn(
              "text-xs truncate transition-colors",
              // 浅色模式
              "text-gray-600",
              // 深色模式
              "dark:text-gray-400",
              // 当前活跃标签页的 URL 颜色
              !isHistory && tab.active && "text-theme-primary-600 dark:text-theme-primary-400"
            )}>
              {tab.url}
            </div>
          </div>
        </div>

        {/* 关闭/删除按钮 */}
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleClose}
            disabled={isClosing}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              // 浅色模式渐变背景
              "text-gray-500 hover:bg-gradient-to-bl hover:from-gray-200 hover:to-gray-100 hover:text-red-600",
              // 深色模式渐变背景
              "dark:text-gray-400 dark:hover:bg-gradient-to-bl dark:hover:from-gray-700 dark:hover:to-gray-800 dark:hover:text-red-400",
              // 主题色支持 - 活跃状态下的按钮渐变
              !isHistory && tab.active && [
                "text-theme-primary-600 hover:bg-gradient-to-bl hover:from-theme-primary-100 hover:to-theme-primary-50 hover:text-red-600",
                "dark:text-theme-primary-400 dark:hover:bg-gradient-to-bl dark:hover:from-theme-primary-900 dark:hover:to-theme-primary-950 dark:hover:text-red-400"
              ],
              // 禁用状态
              isClosing && "cursor-not-allowed opacity-50"
            )}
            title={isHistory ? '删除历史记录' : '关闭标签页'}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}