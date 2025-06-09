import { useEffect, useRef, useState } from "react"

/**
 * 检测元素滚动状态的 Hook
 * @param delay 滚动停止后多久隐藏滚动条 (ms)
 * @returns [ref, isScrolling] ref 绑定到需要监听的元素，isScrolling 表示是否正在滚动
 */
export function useScrollDetection<T extends HTMLElement = HTMLElement>(
  delay: number = 1000
) {
  const ref = useRef<T>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleScroll = () => {
      // 开始滚动
      setIsScrolling(true)

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器，在指定延迟后隐藏滚动条
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, delay)
    }

    element.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      element.removeEventListener("scroll", handleScroll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [delay])

  return [ref, isScrolling] as const
}
