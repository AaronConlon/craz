export function SettingsLoadingSkeleton() {
  return (
    <div className="pb-48 overflow-y-auto scrollbar-macos-thin animate-pulse">
      {/* 标题骨架 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 pb-0 bg-white">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-24 h-6 bg-gray-200 rounded" />
      </div>

      {/* 主题设置骨架 */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-20 h-5 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="w-full h-4 mt-3 bg-gray-200 rounded" />
      </div>

      {/* 语言设置骨架 */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="w-full h-4 mt-3 bg-gray-200 rounded" />
      </div>

      {/* 字体设置骨架 */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="w-full h-4 mt-3 bg-gray-200 rounded" />
      </div>

      {/* 账户状态骨架 */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="flex-1">
              <div className="w-16 h-5 mb-2 bg-gray-200 rounded" />
              <div className="w-32 h-4 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
            <div className="w-20 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
