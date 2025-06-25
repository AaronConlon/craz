import { useEffect, useRef, useState } from 'react'
import { AdvancedDock, type ViewMode } from '~source/shared/components/advanced-dock'
import { cn } from '~source/shared/utils'
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
  const [activeView, setActiveView] = useState<ViewMode>('tabs')
  const ref = useRef<HTMLDivElement>(null)

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
            <TabsContent onClose={onClose} />
          </ViewContainer>
        )
    }
  }

  return (
    <>
      <div
        ref={ref}
        className={cn('flex overflow-hidden flex-col w-full h-full bg-gradient-to-bl from-gray-50 to-white rounded-lg border-t border-gray-200 dark:bg-gradient-to-bl dark:from-gray-800 dark:to-black dark:border-gray-800 theme-transition', className)}
      >
        {/* 主要内容区域 */}
        {renderMainContent()}
      </div>
      {/* 高级 Dock */}
      <AdvancedDock
        className='absolute inset-x-0 bottom-[-68px] mx-auto w-max transition-all duration-300'
        activeView={activeView}
        onViewChange={setActiveView}
      />
    </>
  )
} 