import { Bookmark, BrushCleaning, Copy, ExternalLink, Redo2, Search, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AnimatedCounter, EmptyState, EmptyStateVariants, TabFavicon } from '~source/components'
import { cn, type VisitRecord } from '~source/shared/utils'
import { useDebounce } from '../../../shared/hooks'
import { useCleanDuplicateTabs, useCloseTab, useCreateBookmark, useSwitchTab } from '../model/use-tab-switcher'
import { useRestoreLastClosedTab } from '../model/useRestoreLastClosedTab'
import type { Tab } from '../types'

interface TabsContentProps {
  tabs?: Tab[]
  top7Tabs?: VisitRecord[]
  onClose?: () => void
}

export function TabsContent({ tabs = [], top7Tabs = [], onClose }: TabsContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const switchTab = useSwitchTab()
  const closeTab = useCloseTab()
  const createBookmark = useCreateBookmark()
  const cleanDuplicateTabs = useCleanDuplicateTabs()
  const restoreLastClosedTab = useRestoreLastClosedTab()

  // 过滤标签页
  const filteredTabs = tabs?.filter(tab =>
    tab.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    tab.url.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) ?? []

  const displayTabs = searchQuery?.trim()?.length ? filteredTabs : (top7Tabs || [])

  const handleTabClick = async (tab: Tab) => {
    try {
      await switchTab.mutateAsync(tab.id)
      onClose?.()
    } catch (error) {
      console.error('Failed to switch tab:', error)
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

  return (
    <>
      {/* 搜索框 */}
      <div className="px-4 py-1 border-b border-gray-100">
        <div className="flex gap-4 justify-between items-center py-2 w-full">
          <div className='grid flex-shrink-0 grid-cols-3 gap-2 items-center'>
            {/* 上一个、下一个以及清理重复按钮 */}
            <span
              title="切换到上一个 tab"
              className='p-1 bg-white rounded-full opacity-70 transition-all cursor-pointer hover:bg-gray-100 hover:opacity-100'
              onClick={restoreLastClosedTab.restoreLastClosedTab}
            >
              <Redo2 size={16} className='text-gray-600' />
            </span>
            <span
              title="清理重复 tab"
              onClick={handleCleanDuplicateTabs}
              className={`p-1 transition-all bg-white rounded-full cursor-pointer hover:bg-gray-100 opacity-70 hover:opacity-100 ${cleanDuplicateTabs.isPending ? 'animate-pulse opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <BrushCleaning size={16} className='text-gray-600' />
            </span>
          </div>

          <div className="flex relative flex-grow justify-center items-center mx-auto text-sm font-medium">
            <div className='bg-green-800 rounded-full left-[28px] p-[4px] relative'>
              <Search size={16} color='white' />
            </div>
            <input
              type="text"
              placeholder="搜索标签页..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-[420px] py-1.5 pl-10 text-gray-800 border border-transparent focus:border-gray-100 placeholder-gray-500 transition-all duration-200 rounded-full outline-none bg-gray-50 text-sm"
            />
          </div>

          {/* 动画计数器 */}
          <div className="min-w-[96px] flex justify-end">
            <AnimatedCounter
              value={tabs?.length ?? 0}
              className="flex-shrink-0 text-lg font-black tracking-tight text-gray-800"
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
          <div className="divide-y divide-gray-100">
            {displayTabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="p-3 transition-colors cursor-pointer group hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  {/* 标签页信息 */}
                  <div className="flex flex-1 items-center space-x-3 min-w-0">
                    {/* favicon */}
                    <TabFavicon
                      tab={tab}
                      size={24}
                      className="flex-shrink-0 rounded-full"
                    />

                    {/* 标题和URL */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {tab.title}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {tab.url}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {/* 书签按钮 */}
                    <button
                      onClick={(e) => handleBookmarkTab(tab, e)}
                      disabled={createBookmark.isPending}
                      className="p-1 text-gray-600 rounded hover:bg-gray-200 hover:text-blue-600"
                      title="添加书签"
                    >
                      <Bookmark size={14} />
                    </button>

                    {/* 在新窗口打开 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(tab.url, '_blank')
                      }}
                      className="p-1 text-gray-600 rounded hover:bg-gray-200 hover:text-green-600"
                      title="在新窗口打开"
                    >
                      <ExternalLink size={14} />
                    </button>

                    {/* 复制URL按钮 */}
                    <button
                      onClick={(e) => handleCopyUrl(tab, e)}
                      className="p-1 text-gray-600 rounded hover:bg-gray-200 hover:text-purple-600"
                      title="复制 URL"
                    >
                      <Copy size={14} />
                    </button>

                    {/* 关闭按钮 */}
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      disabled={closeTab.isPending}
                      className="p-1 text-gray-600 rounded hover:bg-gray-200 hover:text-red-600"
                      title="关闭标签页"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 