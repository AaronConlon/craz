import { useState } from 'react'
import { Settings, Save, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { useFaviconBookmarks } from '../../../shared/hooks/use-chrome-storage'
import { Favicon } from '~source/components'

export function SettingsView() {
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    loading,
    error
  } = useFaviconBookmarks()

  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddBookmark = async () => {
    if (newBookmark.title && newBookmark.url) {
      await addBookmark(newBookmark)
      setNewBookmark({ title: '', url: '' })
    }
  }

  const handleSaveEdit = async (id: string, title: string, url: string) => {
    await updateBookmark(id, { title, url })
    setEditingId(null)
  }

  const handleRemoveBookmark = async (id: string) => {
    if (confirm('确定要删除这个书签吗？')) {
      await removeBookmark(id)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
        <p className="text-gray-600">加载设置中...</p>
      </div>
    )
  }

  return (
    <div className="pb-48 overflow-y-auto scrollbar-macos-thin">
      {/* 标题 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 pb-0 bg-white">
        <Settings className="text-gray-700" size={24} />
        <h2 className="text-xl font-bold text-gray-800">扩展设置</h2>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {/* 固定书签管理 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">固定书签管理</h3>
        <p className="text-sm text-gray-600">
          这些书签会显示在 Dock 右侧，并通过 Google 账户自动同步
        </p>

        {/* 添加新书签 */}
        <div className="p-4 space-y-3 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-700">添加新书签</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="书签标题"
              value={newBookmark.title}
              onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newBookmark.url}
              onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddBookmark}
            disabled={!newBookmark.title || !newBookmark.url}
            className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            添加书签
          </button>
        </div>

        {/* 书签列表 */}
        <div className="grid grid-cols-3 gap-2">
          {bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isEditing={editingId === bookmark.id}
              onEdit={() => setEditingId(bookmark.id)}
              onSave={(title, url) => handleSaveEdit(bookmark.id, title, url)}
              onCancel={() => setEditingId(null)}
              onRemove={() => handleRemoveBookmark(bookmark.id)}
            />
          ))}
        </div>
      </div>

      {/* 其他设置 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">其他设置</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">启用键盘快捷键</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">显示标签页预览</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">自动同步设置</span>
          </label>
        </div>
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: any
  isEditing: boolean
  onEdit: () => void
  onSave: (title: string, url: string) => void
  onCancel: () => void
  onRemove: () => void
}

function BookmarkItem({
  bookmark,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRemove
}: BookmarkItemProps) {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)

  const handleSave = () => {
    onSave(title, url)
  }

  const handleCancel = () => {
    setTitle(bookmark.title)
    setUrl(bookmark.url)
    onCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
        <Favicon
          src={bookmark.favIconUrl}
          url={bookmark.url}
          size={20}
        />
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 rounded hover:bg-green-100"
            title="保存"
          >
            <Save size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-600 rounded hover:bg-gray-100"
            title="取消"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 group">
      <Favicon
        src={bookmark.favIconUrl}
        url={bookmark.url}
        size={20}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{bookmark.title}</div>
        <div className="text-sm text-gray-600 truncate">{bookmark.url}</div>
      </div>
      <div className="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="p-1 text-blue-600 rounded hover:bg-blue-100"
          title="编辑"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-red-600 rounded hover:bg-red-100"
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
} 