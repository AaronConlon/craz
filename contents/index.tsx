import { useState, Suspense, useEffect } from "react"
import cssText from "data-text:~style.css"
import sonnerCssText from "data-text:~sonner.css"
import { Toaster } from "sonner"
import { ReactQueryProvider, SuspenseLoader, ErrorBoundary } from "~source/components"
import { TabSwitcher } from "~source/features/tab-switcher"
import { eventStoppers, keyCheckers } from "~source/shared/utils"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText + '\n' + sonnerCssText
  return style
}

export default function ContentUI() {
  const [opened, setOpened] = useState(false)

  // 防止背景页面滚动
  useEffect(() => {
    if (opened) {
      // 保存当前滚动位置
      const scrollY = window.scrollY

      // 锁定滚动
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      // 清理函数：恢复滚动
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''

        // 恢复滚动位置
        window.scrollTo(0, scrollY)
      }
    }
  }, [opened])

  // 监听键盘事件 - 使用原生事件监听器避免被动监听器问题
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Keyboard event:', {
        key: event.key,
        opened,
        modifiers: {
          ctrl: event.ctrlKey,
          alt: event.altKey,
          shift: event.shiftKey,
          meta: event.metaKey
        }
      })

      // 检查当前焦点是否在输入框内
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )

      console.log('isInputFocused:', isInputFocused, 'activeElement:', activeElement?.tagName)

      // 如果正在输入框内输入，则不触发 c 键
      if (isInputFocused) {
        console.log('Input is focused, ignoring c key')
        return
      }

      // c 键切换开关 - 确保只按下了 c 键，没有修饰键
      if (keyCheckers.isPureC(event) && opened === false) {
        console.log('Pure C key pressed (without modifiers), toggling opened state')
        event.preventDefault()
        event.stopPropagation()
        setOpened(prev => !prev)
      }
    }

    // 使用原生 addEventListener，明确设置 passive: false
    window.addEventListener('keydown', handleKeyDown, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [opened])

  if (opened) {
    return (
      <ReactQueryProvider>
        <ErrorBoundary onClose={() => setOpened(false)}>
          <Suspense fallback={<SuspenseLoader />}>
            {/* 毛玻璃遮罩背景 */}
            <div
              className="fixed inset-0 z-[9999998] glass-overlay"
            />
            {/* 居中的 TabSwitcher */}
            <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
              onClick={() => {
                setOpened(false)
              }}
            >
              <div
                {...eventStoppers.keyboard}
                onClick={eventStoppers.stop}
                className="glass-container rounded-2xl max-w-4xl w-full h-[520px] 2xl:h-[720px] max-h-[80vh] overflow-hidden z-[99999999]"
              >
                <TabSwitcher onClose={() => setOpened(false)} />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
        {/* Sonner Toast组件 - 放在最外层确保在最顶层 */}
        <Toaster
          position="top-right"
          expand={false}
          visibleToasts={5}
          className="toast-top-layer"
          toastOptions={{
            duration: 2500,
          }}
        />
      </ReactQueryProvider>
    )
  }

  return null
}