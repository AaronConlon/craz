import { useRef, useState } from 'react'
import {
  Mail,
  Archive,
  X,
  Check,
  Flag
} from 'lucide-react'
import { Button, useContainerRef } from '~source/shared/components'
import { celebrateSuccess } from '~source/shared/utils/confetti'

// 用户信息视图
interface UserProfileViewProps {
  user: any
  onLogout: () => void
}

export function UserProfileView({ user, onLogout }: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    country: 'United States',
    username: user?.username || user?.name?.toLowerCase().replace(' ', '') || ''
  })
  const ref = useContainerRef()

  const handleSave = () => {
    // TODO: 实现保存逻辑
    setIsEditing(false)
    // 保存成功后撒花庆祝
    celebrateSuccess(ref)
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    // 点击编辑时也可以撒花
    celebrateSuccess(ref)
  }

  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin">
      <div className="p-4 mx-auto max-w-3xl bg-white rounded-xl shadow-sm dark:bg-gray-800">
        {/* 头部 */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            {/* 头像 */}
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full"
              />
              <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-5 h-5 bg-blue-500 rounded-full dark:bg-blue-400">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* 用户信息 */}
            <div>
              <div className="flex gap-2 items-center mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                <span className="px-2 py-0.5 text-xs text-green-700 dark:text-green-100 bg-green-100 dark:bg-green-800 rounded-full">
                  Subscribed
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1 items-center">
            <Button variant="outline" size="sm" className="gap-1">
              <Archive size={14} />
              Archive
            </Button>
            <Button variant="outline" size="sm">
              View orders
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">First seen</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">1 Mar, 2025</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">First purchase</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">4 Mar, 2025</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Revenue</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">$118.00</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">MRR</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">$0.00</p>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="space-y-4">
          {/* 姓名 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900 dark:text-white">Name</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="Sienna"
                disabled={!isEditing}
              />
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="Hewitt"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900 dark:text-white">Email address</label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2 dark:text-gray-500" />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="py-1.5 pr-2 pl-8 w-full text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="siennahewitt@gmail.com"
                disabled={!isEditing}
              />
            </div>
            <div className="flex gap-1 items-center mt-1">
              <div className="flex justify-center items-center w-3 h-3 bg-blue-500 rounded-full dark:bg-blue-400">
                <Check className="w-1.5 h-1.5 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">VERIFIED 2 JAN, 2025</span>
            </div>
          </div>

          {/* 国家 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900 dark:text-white">Country</label>
            <div className="relative">
              <div className="flex absolute left-2 top-1/2 gap-1 items-center -translate-y-1/2">
                <Flag className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
              <select
                value={editForm.country}
                onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                className="py-1.5 pr-6 pl-8 w-full text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                disabled={!isEditing}
              >
                <option>United States</option>
                <option>China</option>
                <option>Canada</option>
                <option>United Kingdom</option>
              </select>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block mb-2 text-xs font-medium text-gray-900 dark:text-white">Username</label>
            <div className="flex">
              <div className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-l-md">
                untitledui.com/
              </div>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="siennahewitt"
                disabled={!isEditing}
              />
              <div className="p-1 ml-1 bg-blue-50 rounded-md dark:bg-blue-900">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="text-white bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-gray-900"
              >
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 重置表单
                  setEditForm({
                    firstName: user?.name?.split(' ')[0] || '',
                    lastName: user?.name?.split(' ')[1] || '',
                    email: user?.email || '',
                    country: 'United States',
                    username: user?.username || user?.name?.toLowerCase().replace(' ', '') || ''
                  })
                  // 重置时也撒花
                  celebrateSuccess(ref)
                }}
              >
                Reset to default
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditProfile}
                  className="text-white bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-gray-900"
                >
                  Edit Profile
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 