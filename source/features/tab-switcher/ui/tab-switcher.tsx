import { useEffect, useRef, useState } from 'react'
import { AdvancedDock, type ViewMode } from '~source/shared/components/advanced-dock'
import { ThemeProvider } from '~source/shared/components'
import { cn } from '~source/shared/utils'
import { useBookmarkCount } from '../../../shared/hooks'
import { useAllTabs, useDefaultHistoryTop7 } from '../model/use-tab-switcher'
import { BookmarksView } from './bookmarks-view'
import { ProfileView } from './profile-view'
import { SettingsView } from './settings-view'
import { TabsContent } from './tabs-content'
import { ViewContainer } from './view-container'

interface TabSwitcherProps {
  className?: string
  onClose?: () => void
}

export function TabSwitcher({ className, onClose }: TabSwitcherProps) {
  const [activeView, setActiveView] = useState<ViewMode>('settings')
  const ref = useRef<HTMLDivElement>(null)

  const { data: tabs } = useAllTabs()
  const { data: top7Tabs } = useDefaultHistoryTop7()
  const { userBookmarkCount, teamBookmarkCount } = useBookmarkCount()

  // 监听 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const renderMainContent = () => {
    switch (activeView) {
      case 'settings':
        return (
          <ViewContainer viewMode="settings">
            <SettingsView />
          </ViewContainer>
        )

      case 'profile':
        return (
          <ViewContainer viewMode="profile">
            <ProfileView />
          </ViewContainer>
        )

      case 'user-bookmarks':
        return (
          <ViewContainer viewMode="user-bookmarks">
            <BookmarksView mode="user" />
          </ViewContainer>
        )

      case 'team-bookmarks':
        return (
          <ViewContainer viewMode="team-bookmarks">
            <BookmarksView mode="team" />
          </ViewContainer>
        )

      case 'tabs':
      default:
        return (
          <ViewContainer viewMode="tabs">
            <TabsContent tabs={tabs} top7Tabs={top7Tabs?.data || []} onClose={onClose} />
          </ViewContainer>
        )
    }
  }

  return (
    <>
      <div
        ref={ref}
        className={cn('flex overflow-hidden flex-col w-full h-full bg-white rounded-lg border-t border-gray-200 theme-transition', className)}
      >
        {/* 主要内容区域 */}
        {renderMainContent()}
      </div>
      {/* 高级 Dock */}
      <AdvancedDock
        className='absolute inset-x-0 bottom-[-68px] mx-auto w-max transition-all duration-300'
        activeView={activeView}
        onViewChange={setActiveView}
        tabCount={tabs?.length ?? 0}
        userBookmarkCount={userBookmarkCount}
        teamBookmarkCount={teamBookmarkCount}
      />
    </>
  )
} 