import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onClose?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * 毛玻璃风格的错误边界组件
 * 捕获子组件中的错误并显示友好的错误信息
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // 可以在这里记录错误到错误报告服务
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认的毛玻璃错误界面
      return (
        <div className="flex w-screen h-screen items-center justify-center glass-container fixed inset-0">
          <div className="glass-container rounded-2xl p-6 max-w-[700px] min-w-[560px] mx-auto">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 glass-card rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">出错了</h2>
              </div>
              {this.props.onClose && (
                <button
                  onClick={this.handleClose}
                  className="glass-hover p-2 rounded-full text-gray-600 hover:text-red-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* 错误信息 */}
            <div className="glass-card rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-3">
                应用遇到了一个意外错误，请尝试重新加载。
              </p>

              {/* 开发环境下显示详细错误信息 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer glass-hover p-2 rounded">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 glass-input rounded text-xs font-mono text-gray-700 max-h-[300px] overflow-y-auto break-all">
                    <div className="text-red-600 font-semibold mb-2">
                      错误信息: {this.state.error.message}
                    </div>
                    <div className="text-gray-600">
                      堆栈追踪:
                    </div>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <>
                        <div className="text-gray-600 mt-2">
                          组件堆栈:
                        </div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center space-x-2 glass-hover py-3 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
              >
                <RefreshCw size={16} />
                <span>重试</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex-1 glass-hover py-3 rounded-lg text-gray-700 hover:text-green-600 font-medium"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 函数式组件的 Hook 版本 Error Boundary
 * 由于 React Hook 还不支持 componentDidCatch，这是一个简化版本
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onClose?: () => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onClose={onClose}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
} 