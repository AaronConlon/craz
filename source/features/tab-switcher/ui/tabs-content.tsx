import { Bookmark, BrushCleaning, Copy, ExternalLink, Redo2, Search, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { sendToBackground } from "@plasmohq/messaging"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatedCounter, EmptyState, EmptyStateVariants, TabFavicon } from '~source/components'
import { cn, type VisitRecord } from '~source/shared/utils'
import { useDebounce } from '../../../shared/hooks'
import { useAllTabs, useCleanDuplicateTabs, useCloseTab, useCreateBookmark, useDefaultHistoryTop7, useSwitchTab } from '../model/use-tab-switcher'
import { useRestoreLastClosedTab } from '../model/useRestoreLastClosedTab'
import type { Tab } from '../types'
import { TabListItem } from './tab-list-item'
import { TabMenu, type TabMenuType } from './tab-menu'

interface TabsContentProps {
  onClose?: () => void
}

export function TabsContent({ onClose }: TabsContentProps) {
  const queryClient = useQueryClient()
  const { data: tabs } = useAllTabs()
  const { data: top7Response } = useDefaultHistoryTop7()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  // 右键菜单状态
  const [menuState, setMenuState] = useState<{
    isOpen: boolean
    tab: Tab | null
    type: TabMenuType
    position: { x: number; y: number }
  }>({
    isOpen: false,
    tab: null,
    type: 'current',
    position: { x: 0, y: 0 }
  })

  const switchTab = useSwitchTab()
  const closeTab = useCloseTab()
  const createBookmark = useCreateBookmark()
  const cleanDuplicateTabs = useCleanDuplicateTabs()
  const restoreLastClosedTab = useRestoreLastClosedTab()

  // 从历史记录响应中提取数据数组，并转换为统一格式
  const top7Records = top7Response?.data || []

  // 将 VisitRecord 转换为 Tab 格式以保持一致性
  const top7Tabs: Tab[] = top7Records.map((record, index) => ({
    id: -1, // 历史记录没有 tab id，使用 -1 表示
    url: record.url,
    title: record.title,
    favIconUrl: record.favicon,
    active: false,
    highlighted: false,
    pinned: false,
    selected: false,
    windowId: -1,
    index: index, // 使用数组索引作为排序
    incognito: false,
    discarded: false,
    autoDiscardable: false,
    groupId: -1,
    // 添加自定义属性来存储访问次数
    _visitCount: record.visitCount
  } as Tab & { _visitCount: number }))

  // 过滤标签页
  const filteredTabs = tabs?.filter(tab =>
    tab.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    tab.url?.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) ?? []

  const displayTabs = searchQuery?.trim()?.length ? filteredTabs : top7Tabs

  const handleTabClick = async (tab: Tab) => {
    try {
      if (tab.id === -1) {
        // 这是历史记录项，在新标签页中打开
        window.open(tab.url, '_blank')
        onClose?.()
      } else {
        // 这是真实的标签页，切换到该标签页
        await switchTab.mutateAsync(tab.id!)
        onClose?.()
      }
    } catch (error) {
      console.error('Failed to handle tab click:', error)
    }
  }

  const handleCloseTab = async (tabId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await closeTab.mutateAsync(tabId)
    } catch (error) {
      console.error('Failed to close tab:', error)
    }
  }

  const handleBookmarkTab = async (tab: Tab, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await createBookmark.mutateAsync({
        title: tab.title,
        url: tab.url,
        tags: ['from-tab-switcher'],
      })
      toast.success('已添加书签')
    } catch (error) {
      console.error('Failed to bookmark tab:', error)
      toast.error('书签添加失败')
    }
  }

  const handleCopyUrl = async (tab: Tab, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(tab.url)
      toast.success('已复制链接')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('复制失败')
    }
  }

  const handleCleanDuplicateTabs = async () => {
    try {
      const result = await cleanDuplicateTabs.mutateAsync({
        preserveActiveTab: true,
        dryRun: false
      })

      if (result.totalClosed === 0) {
        toast.info('无重复标签页')
      } else {
        toast.success(`已清理 ${result.totalClosed} 个重复标签页`)
      }
    } catch (error) {
      console.error('Failed to clean duplicate tabs:', error)
      toast.error('清理失败')
    }
  }

  const handleDeleteHistory = async (url: string) => {
    try {
      console.log('[TabsContent] 删除历史记录:', url)

      // 调用 background message 删除历史记录
      const response = await sendToBackground({
        name: "delete-history-record",
        body: { url }
      })

      if (response.success) {
        if (response.deleted) {
          toast.success('已删除历史记录')
          console.log('[TabsContent] 历史记录删除成功，刷新 top7 数据')

          // 重新获取 top7 历史数据
          await queryClient.invalidateQueries({
            queryKey: ["history", "top7"]
          })
        } else {
          toast.info('历史记录不存在')
        }
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete history:', error)
      toast.error('删除历史记录失败')
    }
  }

  // 处理右键菜单
  const handleContextMenu = (tab: Tab, event: React.MouseEvent, type: TabMenuType) => {
    setMenuState({
      isOpen: true,
      tab,
      type,
      position: { x: event.clientX, y: event.clientY }
    })
  }

  // 关闭右键菜单
  const handleCloseMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }))
  }

  // 处理菜单操作
  const handleMenuAction = async (action: string, tab: Tab) => {
    try {
      switch (action) {
        case 'copy-url':
          await navigator.clipboard.writeText(tab.url!)
          toast.success('已复制链接')
          break

        case 'open-new-tab':
          await chrome.tabs.create({ url: tab.url })
          toast.success('已在新标签页中打开')
          break

        case 'add-bookmark':
          await handleBookmarkTab(tab, {} as React.MouseEvent)
          break

        case 'toggle-pin':
          if (tab.id && tab.id !== -1) {
            await chrome.tabs.update(tab.id, { pinned: !tab.pinned })
            toast.success(tab.pinned ? '已取消固定' : '已固定标签页')
          }
          break

        case 'add-to-dock':
          // TODO: 实现添加到快捷栏功能
          toast.info('添加到快捷栏功能开发中')
          break

        case 'add-to-team':
          // TODO: 实现添加到团队功能
          toast.info('添加到团队功能开发中')
          break

        case 'set-hidden-bookmark':
          // TODO: 实现隐藏书签功能
          toast.info('隐藏书签功能开发中')
          break

        case 'close-tab':
          if (tab.id && tab.id !== -1) {
            await handleCloseTab(tab.id, {} as React.MouseEvent)
          }
          break

        case 'restore-tab':
          await chrome.tabs.create({ url: tab.url })
          toast.success('已恢复标签页')
          break

        case 'exclude-from-stats':
          // TODO: 实现从统计中排除功能
          toast.info('排除统计功能开发中')
          break

        case 'delete-history':
          await handleDeleteHistory(tab.url!)
          break

        default:
          console.warn('Unknown menu action:', action)
      }
    } catch (error) {
      console.error('Menu action failed:', error)
      toast.error('操作失败')
    }
  }

  return (
    <>
      {/* 搜索框 */}
      <div className={cn(
        "px-4 py-1 border-b transition-colors",
        // 浅色模式渐变背景
        "border-gray-100 bg-gradient-to-bl from-gray-50 to-white",
        // 深色模式渐变背景
        "dark:border-gray-700 dark:bg-gradient-to-bl dark:from-gray-800 dark:to-black"
      )}>
        <div className="flex gap-4 justify-between items-center py-2 w-full">
          <div className='grid flex-shrink-0 grid-cols-3 gap-2 items-center'>
            {/* 恢复最后关闭的标签页 */}
            <button
              title="恢复最后关闭的标签页"
              onClick={restoreLastClosedTab.restoreLastClosedTab}
              disabled={restoreLastClosedTab.isRestoring}
              className={cn(
                'p-1.5 rounded-full transition-all duration-200 cursor-pointer',
                // 浅色模式渐变背景
                'bg-gradient-to-bl from-white to-gray-50 hover:from-theme-primary-50 hover:to-white opacity-70 hover:opacity-100',
                // 深色模式渐变背景
                'dark:bg-gradient-to-bl dark:from-gray-700 dark:to-gray-800 dark:hover:from-theme-primary-950 dark:hover:to-gray-900',
                // 禁用状态
                restoreLastClosedTab.isRestoring && 'animate-pulse opacity-50 cursor-not-allowed'
              )}
            >
              <Redo2 size={16} className={cn(
                'transition-colors',
                // 浅色模式
                'text-gray-600 group-hover:text-theme-primary-600',
                // 深色模式
                'dark:text-gray-400 dark:group-hover:text-theme-primary-400'
              )} />
            </button>

            {/* 清理重复标签页 */}
            <button
              title="清理重复标签页"
              onClick={handleCleanDuplicateTabs}
              disabled={cleanDuplicateTabs.isPending}
              className={cn(
                'p-1.5 rounded-full transition-all duration-200 cursor-pointer group',
                // 浅色模式渐变背景
                'bg-gradient-to-bl from-white to-gray-50 hover:from-theme-primary-50 hover:to-white opacity-70 hover:opacity-100',
                // 深色模式渐变背景
                'dark:bg-gradient-to-bl dark:from-gray-700 dark:to-gray-800 dark:hover:from-theme-primary-950 dark:hover:to-gray-900',
                // 禁用状态
                cleanDuplicateTabs.isPending && 'animate-pulse opacity-50 cursor-not-allowed'
              )}
            >
              <BrushCleaning size={16} className={cn(
                'transition-colors',
                // 浅色模式
                'text-gray-600 group-hover:text-theme-primary-600',
                // 深色模式
                'dark:text-gray-400 dark:group-hover:text-theme-primary-400'
              )} />
            </button>
          </div>

          <div className="flex relative flex-grow justify-center items-center mx-auto text-sm font-medium">
            <div className={cn(
              'rounded-full left-[28px] p-[4px] relative transition-colors',
              // 主题色图标背景
              'bg-theme-primary-600 dark:bg-theme-primary-500'
            )}>
              <Search size={16} className="text-white" />
            </div>
            <input
              type="text"
              placeholder="搜索标签页..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full max-w-[420px] py-1.5 pl-10 border border-transparent transition-all duration-200 rounded-full outline-none text-sm",
                // 浅色模式渐变背景
                "text-gray-800 bg-gradient-to-bl from-gray-50 to-gray-100 placeholder-gray-500 focus:border-theme-primary-300 focus:from-white focus:to-gray-50",
                // 深色模式渐变背景
                "dark:text-white dark:bg-gradient-to-bl dark:from-gray-800 dark:to-gray-900 dark:placeholder-gray-400 dark:focus:border-theme-primary-600 dark:focus:from-gray-700 dark:focus:to-gray-800"
              )}
            />
          </div>

          {/* 动画计数器 */}
          <div className="min-w-[96px] flex justify-end">
            <AnimatedCounter
              value={tabs?.length ?? 0}
              className={cn(
                "flex-shrink-0 text-lg font-black tracking-tight transition-colors",
                // 浅色模式
                "text-gray-800",
                // 深色模式
                "dark:text-white"
              )}
            />
          </div>
        </div>
      </div>

      {/* 标签页列表 */}
      <div className={cn("overflow-y-auto flex-1 pb-24 scrollbar-macos-thin min-h-[320px]")}>
        {displayTabs.length === 0 ? (
          <EmptyState
            {...(searchQuery
              ? EmptyStateVariants.noSearchResults
              : EmptyStateVariants.noTabs
            )}
          />
        ) : (
            <>
              {displayTabs.map((tab) => (
                <TabListItem
                  key={`${tab.id}-${tab.url}`}
                  tab={tab}
                  onTabClick={handleTabClick}
                  onCloseTab={handleCloseTab}
                  onDeleteHistory={handleDeleteHistory}
                  onContextMenu={handleContextMenu}
                  isClosing={closeTab.isPending}
                />
              ))}
            </>
        )}
      </div>

      {/* 右键菜单 */}
      <TabMenu
        isOpen={menuState.isOpen}
        onClose={handleCloseMenu}
        tab={menuState.tab}
        type={menuState.type}
        position={menuState.position}
        onAction={handleMenuAction}
      />
    </>
  )
} 