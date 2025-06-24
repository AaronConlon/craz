import type { ReactNode } from 'react'
import { cn } from '~source/shared/utils'
import type { ViewMode } from '~source/shared/components/advanced-dock'

interface ViewContainerProps {
  children: ReactNode
  viewMode: ViewMode
  className?: string
}

export function ViewContainer({ children, viewMode, className }: ViewContainerProps) {
  // 为不同的视图模式提供不同的容器样式
  const getContainerClass = (mode: ViewMode) => {
    switch (mode) {
      case 'tabs':
        return 'flex flex-col max-h-[520px] 2xl:max-h-[720px] w-[680px] max-w-[80vw]' // tabs需要flex布局来处理搜索框和列表

      case 'settings':
        return 'overflow-y-auto scrollbar-macos-thin max-h-[80vh] w-[680px] max-w-[80vw] rounded-md' // settings需要padding和滚动

      case 'profile':
        return 'flex items-center justify-center min-h-full' // profile居中显示

      case 'user-bookmarks':
      case 'team-bookmarks':
        return 'flex flex-col h-full p-4' // bookmarks需要flex布局

      default:
        return 'flex flex-col h-full'
    }
  }

  return (
    <div className={cn('rounded-md', getContainerClass(viewMode), className)}>
      {children}
    </div>
  )
} 