import React, { useState } from 'react'

/**
 * 用于测试 Error Boundary 的组件
 * 仅在开发环境下使用
 */
export function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('这是一个测试错误，用于验证 Error Boundary 是否正常工作')
  }

  return (
    <div className="glass-card rounded-lg p-4 m-4">
      <h3 className="font-medium text-gray-800 mb-2">Error Boundary 测试</h3>
      <p className="text-sm text-gray-600 mb-4">
        点击按钮触发一个错误，测试 Error Boundary 的错误捕获功能
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="glass-hover px-4 py-2 rounded text-gray-700 hover:text-red-600 border border-red-300"
      >
        触发错误
      </button>
    </div>
  )
} 