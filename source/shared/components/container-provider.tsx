import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'

// 容器上下文类型
interface ContainerContextType {
  containerRef: RefObject<HTMLDivElement>
}

// 创建容器上下文
const ContainerContext = createContext<ContainerContextType | undefined>(undefined)

// 容器 Provider 组件 Props
interface ContainerProviderProps {
  children: ReactNode
  className?: string
}

/**
 * 全局容器 Provider
 * 提供最外层 div 的 ref 给后代组件使用
 * 这个 ref 通常用于主题应用、界面模式切换等需要在根元素上设置属性的场景
 */
export function ContainerProvider({ children, className = '' }: ContainerProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const contextValue: ContainerContextType = {
    containerRef
  }

  return (
    <ContainerContext.Provider value={contextValue}>
      <div ref={containerRef} className={className} id="craz-container">
        {children}
      </div>
    </ContainerContext.Provider>
  )
}

/**
 * 使用容器 ref 的 Hook
 * @returns 最外层容器的 ref，可用于 DOM 操作、主题应用等
 * @throws 如果在 ContainerProvider 外部使用会抛出错误
 */
export function useContainer() {
  const context = useContext(ContainerContext)

  if (context === undefined) {
    throw new Error('useContainer must be used within a ContainerProvider')
  }

  return context
}

/**
 * 获取容器 ref 的便捷 Hook
 * @returns 容器的 HTMLDivElement ref
 */
export function useContainerRef() {
  const { containerRef } = useContainer()
  return containerRef
}

/**
 * 使用示例:
 * 
 * // 1. 在应用最外层包装 ContainerProvider
 * function App() {
 *   return (
 *     <ContainerProvider className="fixed inset-0 z-[9999999]">
 *       <ThemeProvider>
 *         <YourAppContent />
 *       </ThemeProvider>
 *     </ContainerProvider>
 *   )
 * }
 * 
 * // 2. 在需要容器 ref 的组件中使用
 * function MyComponent() {
 *   const containerRef = useContainerRef()
 *   
 *   useEffect(() => {
 *     if (containerRef.current) {
 *       // 可以直接操作最外层容器
 *       containerRef.current.setAttribute('data-theme', 'dark')
 *     }
 *   }, [])
 *   
 *   return <div>My Component</div>
 * }
 */