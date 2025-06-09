import { useRef, useState } from 'react'
import { useEventListener } from 'ahooks'
import { Search, X, Bookmark, ExternalLink } from 'lucide-react'
import { useAllTabs, useSwitchTab, useCloseTab, useBookmarks, useCreateBookmark } from '../model/use-tab-switcher'
import { useDebounce, useScrollDetection, useBookmarkCount } from '../../../shared/hooks'
import { TabFavicon, AnimatedCounter } from '~source/components'
import { AdvancedDock, type ViewMode } from '../../../shared/components/advanced-dock'
import { SettingsView } from './settings-view'
import { BookmarksView } from './bookmarks-view'
import type { Tab } from '../types'
import { cn, eventStoppers } from '~source/shared/utils'

interface TabSwitcherProps {
  className?: string
  onClose?: () => void
}

export function TabSwitcher({ className, onClose }: TabSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<ViewMode>('tabs')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const ref = useRef<HTMLDivElement>(null)

  const { data: tabs } = useAllTabs()
  // const { data: bookmarks } = useBookmarks({ pageSize: 50 })
  const { userBookmarkCount, teamBookmarkCount } = useBookmarkCount()

  const switchTab = useSwitchTab()
  const closeTab = useCloseTab()
  const createBookmark = useCreateBookmark()

  // 滚动检测
  const [scrollRef, isScrolling] = useScrollDetection<HTMLDivElement>(1500)

  // 监听 ESC 键关闭
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
  }, { target: ref.current })

  // 过滤标签页
  const filteredTabs = tabs?.filter(tab =>
    tab.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    tab.url.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) ?? []

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
    } catch (error) {
      console.error('Failed to bookmark tab:', error)
    }
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'settings':
        return <SettingsView />

      case 'user-bookmarks':
        return <BookmarksView mode="user" />

      case 'team-bookmarks':
        return <BookmarksView mode="team" />

      case 'tabs':
      default:
        return (
          <>
            {/* 搜索框 */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute z-10 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
                <input
                  type="text"
                  placeholder="搜索标签页..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-10 pr-20 text-gray-800 placeholder-gray-500 transition-all duration-200 rounded-lg outline-none bg-gray-50"
                />
                {/* 动画计数器 */}
                <div className="absolute transform -translate-y-1/2 pointer-events-none top-1/2 right-3">
                  <AnimatedCounter
                    value={filteredTabs.length}
                    className="text-lg font-black tracking-tight text-gray-800"
                    suffix={searchQuery ? ` / ${tabs.length}` : ''}
                  />
                </div>
              </div>
            </div>

            {/* 标签页列表 */}
            <div
              ref={scrollRef}
              className={cn(
                "flex-1 overflow-y-auto scrollbar-macos-thin min-h-[320px]",
                isScrolling && "scrolling"
              )}
            >
              {filteredTabs.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  {searchQuery ? '没有找到匹配的标签页' : '没有打开的标签页'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTabs.map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className="p-3 transition-colors cursor-pointer group hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        {/* 标签页信息 */}
                        <div className="flex items-center flex-1 min-w-0 space-x-3">
                          {/* favicon */}
                          <TabFavicon
                            tab={tab}
                            size={16}
                            className="flex-shrink-0"
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
                        <div className="flex items-center space-x-1 transition-opacity opacity-0 group-hover:opacity-100">
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
  }

  return (
    <div ref={ref} className={cn('w-full max-h-[80vh] flex flex-col bg-white border-t border-gray-200', className)}
      {...eventStoppers.all}
    >
      {/* 主要内容区域 */}
      <div className="flex flex-col flex-1 min-h-0">
        {renderMainContent()}
      </div>

      {/* 高级 Dock */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200">
        <AdvancedDock
          activeView={activeView}
          onViewChange={setActiveView}
          tabCount={tabs?.length ?? 0}
          userBookmarkCount={userBookmarkCount}
          teamBookmarkCount={teamBookmarkCount}
        />
      </div>
    </div>
  )
} 