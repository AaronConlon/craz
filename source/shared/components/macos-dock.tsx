import { useRef, useState } from 'react'
import { FileText, Bookmark, Users, Minus, Cloud } from 'lucide-react'
import { cn } from '../utils'

interface DockItem {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
  active?: boolean
  onClick?: () => void
}

interface MacOSDockProps {
  className?: string
  items?: DockItem[]
}

/**
 * macOS 风格的 Dock 组件
 * 支持鼠标滚轮横向滚动
 */
export function MacOSDock({ className, items = [] }: MacOSDockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 默认的 dock 项目
  const defaultItems: DockItem[] = [
    {
      id: 'current-tab',
      label: '当前标签页',
      icon: <FileText size={20} />,
      active: true,
      onClick: () => console.log('Current tab clicked')
    },
    {
      id: 'chrome-bookmarks',
      label: 'Chrome 书签',
      icon: <Bookmark size={20} />,
      count: 42,
      onClick: () => console.log('Chrome bookmarks clicked')
    },
    {
      id: 'team-bookmarks',
      label: '团队书签',
      icon: <Users size={20} />,
      count: 18,
      onClick: () => console.log('Team bookmarks clicked')
    },
    {
      id: 'separator',
      label: '',
      icon: <Minus size={16} className="text-gray-400 rotate-90" />,
    },
    {
      id: 'cloud-bookmarks',
      label: '私人云书签',
      icon: <Cloud size={20} />,
      count: 156,
      onClick: () => console.log('Cloud bookmarks clicked')
    }
  ]

  const dockItems = items.length > 0 ? items : defaultItems

  // 处理鼠标滚轮横向滚动
  const handleWheel = (event: React.WheelEvent) => {
    if (!scrollRef.current) return

    event.preventDefault()
    const container = scrollRef.current

    // 将垂直滚动转换为横向滚动
    const scrollAmount = event.deltaY * 0.5
    container.scrollLeft += scrollAmount
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 px-2 py-1 overflow-x-auto border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl scrollbar-macos-thin"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {dockItems.map((item, index) => (
          <DockItem
            key={item.id || index}
            item={item}
            className={cn(
              item.id === 'separator' && "mx-2"
            )}
          />
        ))}
      </div>
    </div>
  )
}

interface DockItemProps {
  item: DockItem
  className?: string
}

function DockItem({ item, className }: DockItemProps) {
  if (item.id === 'separator') {
    return (
      <div className={cn("flex items-center", className)}>
        {item.icon}
      </div>
    )
  }

  return (
    <button
      onClick={item.onClick}
      className={cn(
        "relative flex items-center justify-center p-3 rounded-xl transition-all duration-200 group",
        "hover:bg-white/20 hover:scale-105",
        item.active && "bg-white/25 scale-105 shadow-md",
        className
      )}
      title={item.label}
    >
      <div className="relative">
        {item.icon}

        {/* 数量标记 */}
        {typeof item.count === 'number' && item.count > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-theme-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {item.count > 99 ? '99+' : item.count}
          </div>
        )}

        {/* 活动指示器 */}
        {item.active && (
          <div className="absolute w-1 h-1 transform -translate-x-1/2 bg-white rounded-full -bottom-4 left-1/2 opacity-80" />
        )}
      </div>

      {/* 悬停提示 */}
      <div className="absolute px-2 py-1 text-xs text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-800 rounded opacity-0 pointer-events-none -top-10 left-1/2 group-hover:opacity-100 whitespace-nowrap">
        {item.label}
      </div>
    </button>
  )
} 