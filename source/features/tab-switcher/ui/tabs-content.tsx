import { sendToBackground } from "@plasmohq/messaging"
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { BrushCleaning, Redo2, Search } from 'lucide-react'
import { unique } from 'radash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AnimatedCounter, EmptyState, EmptyStateVariants } from '~source/components'
import { OgPreview } from '~source/shared/components'
import { getLocalHistory } from '~source/shared/api/messages'
import { cn, copyShare } from '~source/shared/utils'
import { useDebounce, useSearchHistory, useOGData } from '../../../shared/hooks'
import { useAllTabs, useCleanDuplicateTabs, useCloseTab, useCreateBookmark, useSwitchTab } from '../model/use-tab-switcher'
import { useRestoreLastClosedTab } from '../model/useRestoreLastClosedTab'
import type { Tab } from '../types'
import { TabListItem } from './tab-list-item'
import { TabMenu, type TabMenuType } from './tab-menu'


interface TabsContentProps {
  onClose?: () => void
}

export function TabsContent({ onClose }: TabsContentProps) {
  const FAVICON_DOCK_ITEMS_QUERY_KEY = ["favicon-dock-items"] as const
  const queryClient = useQueryClient()
  const { data: tabs } = useAllTabs()

  // 获取本地历史记录（最常访问的记录）
  const { data: historyResponse } = useSuspenseQuery({
    queryKey: ["local-history", "mostVisited"],
    queryFn: async () => {
      return await getLocalHistory({
        type: "mostVisited",
        limit: 20 // 获取更多记录用于筛选
      })
    },
    staleTime: 1000 * 60 * 5, // 5分钟内数据有效
  })



  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  // 搜索历史记录用于补全结果
  const { data: searchHistoryResponse } = useSearchHistory(
    debouncedQuery,
    5, // 最多获取5条历史记录
  )

  // 键盘快捷键相关状态
  const [isCommandMode, setIsCommandMode] = useState(false)
  const [visibleTabsWithKeys, setVisibleTabsWithKeys] = useState<Array<{ tab: Tab; key: string; index: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // 定义键序列 qwertyuiopasdfghjklzxcvbnm
  const keySequence = 'qwertyuiopasdfghjklzxcvbnm'.split('')

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

  // OG 预览状态
  const [ogPreviewState, setOgPreviewState] = useState<{
    isOpen: boolean
    tab: Tab | null
    position: { x: number; y: number }
  }>({
    isOpen: false,
    tab: null,
    position: { x: 0, y: 0 }
  })

  const ogHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 获取 OG 数据
  const { data: ogData, isLoading: ogLoading } = useOGData(
    ogPreviewState.tab?.url || null
  )

  const switchTab = useSwitchTab()
  const closeTab = useCloseTab()
  const createBookmark = useCreateBookmark()
  const cleanDuplicateTabs = useCleanDuplicateTabs()
  const restoreLastClosedTab = useRestoreLastClosedTab()

  // 使用 useMemo 计算默认标签页
  const defaultTabs = useMemo(() => {
    if (!tabs || !historyResponse?.data) {
      return []
    }

    const currentTabs = tabs
    const historyRecords = historyResponse.data


    // 1. 从当前打开的标签页中选择前两个最近访问的（排除当前激活标签页）
    const recentCurrentTabs = unique(currentTabs, i => i.url)
      .filter(tab => {
        // 确保有 lastAccessed 属性
        return (tab as any).lastAccessed
      })
      .sort((a, b) => ((b as any).lastAccessed || 0) - ((a as any).lastAccessed || 0)) // 按最近访问时间排序
      .slice(1, 5)


    // 2. 获取当前标签页的 URL 集合，用于去重（包含当前激活标签页）
    const currentTabUrls = new Set(currentTabs.map(tab => tab.url))

    // 3. 从历史记录中筛选不存在于当前打开标签页的记录，并按域名去重
    const seenDomains = new Set<string>()
    const historyTabs: Tab[] = []

    for (const record of historyRecords) {
      if (historyTabs.length >= 5) break // 最多5个

      // 跳过已在当前标签页中的URL（包括当前激活标签页）
      if (currentTabUrls.has(record.url)) continue

      // 获取域名
      let domain: string
      try {
        domain = new URL(record.url).hostname
      } catch {
        continue // 跳过无效的URL
      }

      // 跳过已见过的域名
      if (seenDomains.has(domain)) continue
      seenDomains.add(domain)

      // 转换为 Tab 格式
      historyTabs.push({
        id: -1, // 历史记录没有 tab id，使用 -1 表示
        url: record.url,
        title: record.title,
        favIconUrl: record.favicon,
        active: false,
        highlighted: false,
        pinned: false,
        selected: false,
        windowId: -1,
        index: recentCurrentTabs.length + historyTabs.length,
        incognito: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
        // 添加自定义属性来存储访问次数
        _visitCount: record.visitCount
      } as Tab & { _visitCount: number })
    }

    // 4. 合并结果：前两个当前标签页 + 最多5个不同域名的历史记录
    const res = [...recentCurrentTabs, ...historyTabs]
    return res
  }, [tabs, historyResponse])

  // 过滤标签页
  const filteredTabs = tabs?.filter(tab =>
    tab.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    tab.url?.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) ?? []

  // 主要显示数据
  let displayTabs = searchQuery?.trim()?.length ? filteredTabs : defaultTabs

  // 补全逻辑：如果搜索结果少于4个且有搜索内容，用历史记录补全
  if (searchQuery?.trim()?.length && displayTabs.length < 4 && searchHistoryResponse?.length) {

    // 获取历史记录数据
    const historyRecords = searchHistoryResponse

    // 将历史记录转换为 Tab 格式，并避免重复
    const existingUrls = new Set(displayTabs.map(tab => tab.url))
    const historyTabs = historyRecords
      .filter(record => !existingUrls.has(record.url)) // 避免重复
      .slice(0, 4 - displayTabs.length) // 只取需要的数量
      .map((record, index) => ({
        id: -2 - index, // 使用负数区分历史记录补全项（-2, -3, -4...）
        url: record.url,
        title: record.title,
        favIconUrl: record.favicon,
        active: false,
        highlighted: false,
        pinned: false,
        selected: false,
        windowId: -1,
        index: displayTabs.length + index,
        incognito: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
        // 标记为历史记录补全项
        _isHistoryComplement: true,
        _visitCount: record.visitCount
      } as Tab & { _isHistoryComplement: boolean; _visitCount: number }))

    // 合并显示数据
    displayTabs = [...displayTabs, ...historyTabs]
  }

  // 更新可视区域内的标签页和对应按键
  const updateVisibleTabs = useCallback((forceCommandMode?: boolean) => {
    const currentCommandMode = forceCommandMode ?? isCommandMode

    if (!containerRef.current || !currentCommandMode) {
      return
    }

    const tabElements = containerRef.current.querySelectorAll('[data-tab-item]')
    const visibleTabs: Array<{ tab: Tab; key: string; index: number }> = []

    tabElements.forEach((element, index) => {
      const tabIndex = parseInt(element.getAttribute('data-tab-index') || '0')
      const tab = displayTabs[tabIndex]

      // 临时简化：先为所有标签页分配字母，不检查可视区域
      const isVisible = !!tab // 只要有 tab 就认为可见

      if (tab && isVisible) {
        const keyIndex = visibleTabs.length
        if (keyIndex < keySequence.length) {
          const assignedKey = keySequence[keyIndex]
          visibleTabs.push({
            tab,
            key: assignedKey,
            index: tabIndex
          })
        }
      }
    })

    setVisibleTabsWithKeys(visibleTabs)
  }, [isCommandMode, displayTabs, keySequence])

  // 处理搜索框的键盘事件
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {

    // 如果按下 enter 键，则直接打开第一个搜索结果
    if (event.key === 'Enter') {
      event.preventDefault()
      const firstTab = displayTabs[0]
      if (firstTab) {
        handleTabClick(firstTab)
      }
    }

    // 检测单独的 Alt 键（不是组合键）
    const isAltKeyOnly = event.key === 'Alt' && !event.ctrlKey && !event.shiftKey && !event.metaKey

    if (isAltKeyOnly) {
      event.preventDefault()
      // 如果已经在 Command 模式，则退出；否则进入
      if (isCommandMode) {
        setIsCommandMode(false)
        setVisibleTabsWithKeys([])
        // 重新 focus 到搜索框
        setTimeout(() => {
          const input = event.target as HTMLInputElement
          input.focus()
        }, 0)
        return
      } else {
        setIsCommandMode(true)
        return
      }
    }

    // 在 Command 模式下处理字母按键
    if (isCommandMode && event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault()
      const pressedKey = event.key.toLowerCase()

      const matchedTab = visibleTabsWithKeys.find(item => item.key === pressedKey)
      if (matchedTab) {
        handleTabClick(matchedTab.tab)
      }
      return
    }

    // Escape 键退出 Command 模式
    if (event.key === 'Escape' && isCommandMode) {
      event.preventDefault()
      setIsCommandMode(false)
      setVisibleTabsWithKeys([])
      return
    }

    // 在 Command 模式下阻止正常的输入行为
    if (isCommandMode) {
      event.preventDefault()
      return
    }
  }

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 在 Command 模式下不修改搜索内容
    if (isCommandMode) {
      return
    }
    setSearchQuery(e.target.value)
  }

  // 监听 Command 模式变化，自动更新可视区域
  useEffect(() => {
    if (isCommandMode && containerRef.current) {
      updateVisibleTabs()
    } else if (!isCommandMode && visibleTabsWithKeys.length > 0) {
      // 只在有快捷键时才清空，避免无限循环
      setVisibleTabsWithKeys([])
    }
  }, [isCommandMode]) // 移除 displayTabs 依赖，避免无限循环

  // 监听滚动事件，更新可视区域
  useEffect(() => {
    if (!containerRef.current || !isCommandMode) return

    const handleScroll = () => {
      updateVisibleTabs()
    }

    const container = containerRef.current
    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [isCommandMode, displayTabs])

  const handleTabClick = async (tab: Tab) => {
    try {
      if (tab.id === -1 || (tab as any)._isHistoryComplement) {

        const record = tabs.find(i => i.url === tab.url)
        if (record) {
          await switchTab.mutateAsync(record.id!)
          onClose?.()
        } else {
          // 这是历史记录项或补全项，在新标签页中打开
          window.open(tab.url, '_blank')
          onClose?.()
        }
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
      // 调用 background message 删除历史记录
      const response = await sendToBackground({
        name: "delete-history-record",
        body: { url }
      })

      if (response.success) {
        if (response.deleted) {
          toast.success('已删除历史记录')

          // 重新获取本地历史数据
          await queryClient.invalidateQueries({
            queryKey: ["local-history", "mostVisited"]
          })

          // 刷新搜索历史记录数据
          await queryClient.invalidateQueries({
            queryKey: ["search-history"]
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

    // 对于历史记录补全项，强制使用 'history' 类型
    const contextMenuType = (tab as any)._isHistoryComplement ? 'history' : type

    setMenuState({
      isOpen: true,
      tab,
      type: contextMenuType,
      position: { x: event.clientX, y: event.clientY }
    })
  }

  // 关闭右键菜单
  const handleCloseMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }))
  }

  // 处理 OG 预览悬停
  const handleOgHover = (tab: Tab, position: { x: number; y: number }) => {
    // 清除之前的定时器
    if (ogHoverTimeoutRef.current) {
      clearTimeout(ogHoverTimeoutRef.current)
    }

    // 设置 0.5 秒后显示 OG 预览
    ogHoverTimeoutRef.current = setTimeout(() => {
      setOgPreviewState({
        isOpen: true,
        tab,
        position
      })
    }, 500)
  }

  // 处理 OG 预览离开
  const handleOgLeave = () => {
    // 清除定时器
    if (ogHoverTimeoutRef.current) {
      clearTimeout(ogHoverTimeoutRef.current)
      ogHoverTimeoutRef.current = null
    }

    // 隐藏预览
    setOgPreviewState(prev => ({ ...prev, isOpen: false }))
  }

  // 清理 OG 预览定时器
  useEffect(() => {
    return () => {
      if (ogHoverTimeoutRef.current) {
        clearTimeout(ogHoverTimeoutRef.current)
      }
    }
  }, [])

  // 处理菜单操作
  const handleMenuAction = async (action: string, tab: Tab) => {
    try {
      switch (action) {
        case 'share-website-copy-url':
          const success = await copyShare(tab.title || '', tab.url || '')
          if (success) {
            toast.success('站点地址和标题已经复制到剪贴板 ❤️')
          } else {
            toast.error('复制失败，请重试')
          }
          break

        case 'share-website-copy-markdown':
          const markdownLink = `[${tab.title || ''}](${tab.url || ''})`
          try {
            await navigator.clipboard.writeText(markdownLink)
            toast.success('Markdown 链接已复制到剪贴板 📋')
          } catch (error) {
            console.error('Failed to copy markdown link:', error)
            toast.error('复制失败，请重试')
          }
          break

        case 'share-website-to-x':
          const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tab.title || '')}&url=${encodeURIComponent(tab.url || '')}`
          window.open(xUrl, '_blank', 'width=550,height=420')
          toast.success('已打开 X 分享页面')
          break


        case 'open-new-tab':
          const createResponse = await sendToBackground({
            name: "tab-action",
            body: {
              action: "create-tab",
              url: tab.url
            }
          })
          if (createResponse.success) {
            toast.success('已在新标签页中打开')
          } else {
            throw new Error(createResponse.error || '打开新标签页失败')
          }
          break

        case 'add-bookmark':
          await handleBookmarkTab(tab, {} as React.MouseEvent)
          break

        case 'toggle-pin':
          if (tab.id && tab.id !== -1) {
            const pinResponse = await sendToBackground({
              name: "tab-action",
              body: {
                action: "toggle-pin",
                tabId: tab.id
              }
            })
            if (pinResponse.success) {
              const wasPinned = tab.pinned
              toast.success(wasPinned ? '已取消固定' : '已固定标签页')
              // 刷新标签页数据
              await queryClient.invalidateQueries({ queryKey: ['tabs'] })
            } else {
              throw new Error(pinResponse.error || '切换固定状态失败')
            }
          }
          break

        case 'add-to-dock':
          const addDockResponse = await sendToBackground({
            name: "add-favicon-dock-item",
            body: {
              url: tab.url!,
              title: tab.title!,
              favicon: tab.favIconUrl,
              tabId: tab.id !== -1 ? tab.id : undefined
            }
          })

          if (addDockResponse.success) {
            // 刷新快捷栏数据
            await queryClient.invalidateQueries({ queryKey: FAVICON_DOCK_ITEMS_QUERY_KEY })
          } else {
            throw new Error(addDockResponse.error || '添加到快捷栏失败')
          }
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
          const restoreResponse = await sendToBackground({
            name: "tab-action",
            body: {
              action: "create-tab",
              url: tab.url
            }
          })
          if (restoreResponse.success) {
            toast.success('已恢复标签页')
          } else {
            throw new Error(restoreResponse.error || '恢复标签页失败')
          }
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
              autoFocus={true}
              placeholder={isCommandMode ? "按字母键快速切换标签页..." : "搜索标签页..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className={cn(
                "w-full max-w-[420px] py-1.5 pl-10 border border-transparent transition-all duration-200 rounded-full outline-none text-sm",
                // 浅色模式渐变背景
                "text-gray-800 bg-gradient-to-bl from-gray-50 to-gray-100 placeholder-gray-500 focus:border-theme-primary-300 focus:from-white focus:to-gray-50",
                // 深色模式渐变背景
                "dark:text-white dark:bg-gradient-to-bl dark:from-gray-800 dark:to-gray-900 dark:placeholder-gray-400 dark:focus:border-theme-primary-600 dark:focus:from-gray-700 dark:focus:to-gray-800",
                // Command 模式下的特殊样式
                isCommandMode && [
                  "border-theme-primary-500 dark:border-theme-primary-400",
                  "from-theme-primary-50 to-white dark:from-theme-primary-950 dark:to-gray-800",
                  "placeholder-theme-primary-600 dark:placeholder-theme-primary-400"
                ]
              )}
            />
          </div>

          {/* 动画计数器 */}
          <div className="min-w-[96px] flex justify-end">
            {
              searchQuery?.trim()?.length ? <AnimatedCounter
                value={displayTabs.length}
                className={cn(
                  "flex-shrink-0 text-lg font-black tracking-tight transition-colors",
                  // 浅色模式
                  "text-gray-800",
                  // 深色模式
                  "dark:text-white"
                )}
              /> : null
            }
          </div>
        </div>
      </div>

      {/* 标签页列表 */}
      <div
        ref={containerRef}
        className={cn("overflow-y-auto flex-1 pb-24 scrollbar-macos-thin min-h-[580px] max-h-[92vh]")}
      >
        {displayTabs.length === 0 && searchQuery?.trim().length ? (
          <EmptyState
            {...(searchQuery
              ? EmptyStateVariants.noSearchResults
              : EmptyStateVariants.noTabs
            )}
          />
        ) : (
            <>
              {displayTabs.map((tab, idx) => {
                // 查找当前标签页对应的按键
                const tabWithKey = visibleTabsWithKeys.find(item => item.index === idx)
                const shortcutKey = tabWithKey?.key

              return (
                <div
                  key={`${tab.id}-${tab.url}`}
                  data-tab-item
                  data-tab-index={idx}
                >
                  <TabListItem
                    tab={tab}
                    isFirst={idx < 1}
                    onTabClick={handleTabClick}
                    onCloseTab={handleCloseTab}
                    onDeleteHistory={handleDeleteHistory}
                    onContextMenu={handleContextMenu}
                    onOgHover={handleOgHover}
                    onOgLeave={handleOgLeave}
                    isClosing={closeTab.isPending}
                    // 传递快捷键相关属性
                    showShortcutKey={isCommandMode}
                    shortcutKey={shortcutKey}
                    // 传递历史记录补全标识
                    isHistoryComplement={(tab as any)._isHistoryComplement}
                  />
                </div>
              )
            })}
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

      {/* OG 预览 */}
      {ogPreviewState.isOpen && ogPreviewState.tab && ogData && !ogLoading && (
        <div
          className="fixed z-50"
          style={{
            left: ogPreviewState.position.x + 16, // 16px 的右边距
            top: ogPreviewState.position.y,
            transform: 'translateY(-50%)' // 垂直居中对齐
          }}
          onMouseEnter={() => {
            // 鼠标进入预览区域时保持显示
            if (ogHoverTimeoutRef.current) {
              clearTimeout(ogHoverTimeoutRef.current)
              ogHoverTimeoutRef.current = null
            }
          }}
          onMouseLeave={handleOgLeave}
        >
          <OgPreview ogData={ogData} url={ogPreviewState.tab.url!} />
        </div>
      )}
    </>
  )
} 