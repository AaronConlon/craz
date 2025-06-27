import { CircleDot, Copy, History, Pin, X } from 'lucide-react'
import { TabFavicon } from '~source/components'
import { cn, copyUrl } from '~source/shared/utils'
import type { Tab } from '../types'
import { toast } from 'sonner'

interface TabListItemProps {
  tab: Tab
  onTabClick: (tab: Tab) => void
  onCloseTab: (tabId: number, event: React.MouseEvent) => void
  onDeleteHistory: (url: string) => void
  onContextMenu?: (tab: Tab, event: React.MouseEvent, type: 'current' | 'history') => void
  isClosing?: boolean
  className?: string
  isFirst?: boolean
  // 快捷键相关属性
  showShortcutKey?: boolean
  shortcutKey?: string
  // 历史记录补全标识
  isHistoryComplement?: boolean
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
  className,
  isFirst = false,
  showShortcutKey = false,
  shortcutKey,
  isHistoryComplement = false
}: TabListItemProps) {
  // 判断是否为历史记录（id 为 -1 或历史记录补全项）
  const isHistory = tab.id === -1 || isHistoryComplement

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

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const success = await copyUrl(tab.url || '')
    if (success) {
      toast.success('网址已复制到剪贴板 ❤️')
    } else {
      toast.error('复制失败，请重试')
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
        // 禁用状态
        isClosing && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex justify-between items-center">
        {/* 标签页信息 */}
        <div className="flex flex-1 items-center space-x-3 min-w-0">
          {/* Favicon */}
          <div className="relative flex-shrink-0">
            {showShortcutKey && shortcutKey ? (
              // 显示快捷键字母
              <div className={cn(
                "w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                // 浅色模式 - 最浅的主题色背景
                "bg-theme-primary-50 text-theme-primary-700 border border-theme-primary-200",
                // 深色模式 - 最浅的主题色背景
                "dark:bg-theme-primary-950 dark:text-theme-primary-300 dark:border-theme-primary-800",
                // 动画效果
                "animate-pulse shadow-lg"
              )}>
                {shortcutKey.toUpperCase()}
              </div>
            ) : (
                <TabFavicon
                  tab={tab}
                  size={18}
                  className="flex-shrink-0 rounded-full"
                />
            )}

          </div>

          {/* 标题和URL */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 items-center">
              <div>
                {/* 标题 */}
                <div className={cn(
                  "text-sm font-medium truncate transition-colors",
                  // 浅色模式
                  "text-gray-900",
                  // 深色模式
                  "dark:text-white",
                // 当前活跃标签页强调色
                  // !isHistory && tab.active && "text-theme-primary-700 dark:text-theme-primary-300"
                )}>
                  {tab.title}
                </div>
                {
                  isHistory && (
                    <div className='max-w-[320px] truncate text-xs opacity-50'>
                      {tab.url}
                    </div>
                  )
                }

              </div>

              {/* 标签页状态和历史记录标识 */}
              <div className="flex flex-shrink-0 gap-1 items-center">
                {/* 当前标签页标识 */}
                {!isHistory && tab.active && (
                  <span className={cn(
                    "text-xs p-0.5 rounded-full",
                    // 浅色模式
                    "bg-theme-primary-100 text-theme-primary-700",
                    // 深色模式
                    "dark:bg-theme-primary-900 dark:text-theme-primary-300"
                  )}>
                    <CircleDot size={12} className="animate-ping" />
                  </span>
                )}

                {/* 历史记录标识 */}
                {isHistory && isFirst && !isHistoryComplement && (
                  <span className={cn(
                    "text-xs p-0.5 rounded-full",
                    // 浅色模式
                    "bg-theme-primary-50 text-theme-primary-500",
                  )}>
                    🔥
                  </span>
                )}

                {/* 历史记录补全标识 */}
                {isHistoryComplement && (
                  <span title='历史记录' className={cn(
                    "text-xs p-0.5 rounded-full",
                    // 浅色模式
                    "bg-theme-primary-100 text-theme-primary-700",
                    // 深色模式
                    "dark:bg-theme-primary-900 dark:text-theme-primary-300"
                  )}>
                    <History size={12} />
                  </span>
                )}



                {/* 访问次数
                {isHistory && visitCount && isFirst && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    // 浅色模式
                    "bg-gray-100 text-gray-600",
                    // 深色模式
                    "dark:bg-gray-700 dark:text-gray-300"
                  )}>

                  </span>
                )} */}

                {/* 固定标签页标识 */}
                {!isHistory && tab.pinned && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    // 浅色模式
                    "bg-theme-primary-100 text-theme-primary-600",
                    // 深色模式
                    "dark:bg-theme-primary-900 dark:text-theme-primary-300"
                  )}>
                    <Pin size={12} />
                  </span>
                )}
              </div>
            </div>

            <div className="hidden items-center group">
              {/* URL */}
              <div className={cn(
                "text-xs truncate transition-colors max-w-[200px] items-center inline-block",
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
        </div>

        {/* 关闭/删除按钮 */}
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={handleCopyUrl}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              // 浅色模式渐变背景
              "text-gray-500 hover:bg-gradient-to-bl hover:from-gray-200 hover:to-gray-100 hover:text-theme-primary-600",
              // 深色模式渐变背景
              "dark:text-gray-400 dark:hover:bg-gradient-to-bl dark:hover:from-gray-700 dark:hover:to-gray-800 dark:hover:text-theme-primary-400",
              // 主题色支持 - 活跃状态下的按钮渐变
              !isHistory && tab.active && [
                "text-theme-primary-600 hover:bg-gradient-to-bl hover:from-theme-primary-100 hover:to-theme-primary-50 hover:text-theme-primary-700",
                "dark:text-theme-primary-400 dark:hover:bg-gradient-to-bl dark:hover:from-theme-primary-900 dark:hover:to-theme-primary-950 dark:hover:text-theme-primary-300"
              ],
              // 禁用状态
              isClosing && "cursor-not-allowed opacity-50"
            )}
            title={'复制网址'}
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleClose}
            disabled={isClosing}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              // 浅色模式渐变背景
              "text-gray-500 hover:bg-gradient-to-bl hover:from-gray-200 hover:to-gray-100 hover:text-theme-primary-600",
              // 深色模式渐变背景
              "dark:text-gray-400 dark:hover:bg-gradient-to-bl dark:hover:from-gray-700 dark:hover:to-gray-800 dark:hover:text-theme-primary-400",
              // 主题色支持 - 活跃状态下的按钮渐变
              !isHistory && tab.active && [
                "text-theme-primary-600 hover:bg-gradient-to-bl hover:from-theme-primary-100 hover:to-theme-primary-50 hover:text-theme-primary-700",
                "dark:text-theme-primary-400 dark:hover:bg-gradient-to-bl dark:hover:from-theme-primary-900 dark:hover:to-theme-primary-950 dark:hover:text-theme-primary-300"
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