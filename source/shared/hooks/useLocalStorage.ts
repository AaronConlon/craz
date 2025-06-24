import { useEffect, useState } from "react"

/**
 * 使用 Chrome Storage 的自定义 hook (替代 localStorage)
 * 在 Chrome 扩展中，Chrome Storage 比 localStorage 更可靠
 * @param key - storage 键名
 * @param initialValue - 初始值
 * @returns [value, setValue] - 值和设置值的函数
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)

  // 从 Chrome Storage 读取初始值
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          const result = await chrome.storage.local.get([key])
          const item = result[key]
          if (item !== undefined) {
            setStoredValue(item)
          }
        }
      } catch (error) {
        console.error(`Error reading Chrome Storage key "${key}":`, error)
      } finally {
        setLoading(false)
      }
    }

    loadFromStorage()

    // 监听 Chrome Storage 变化
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      if (changes[key]) {
        setStoredValue(changes[key].newValue ?? initialValue)
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange)

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange)
      }
    }
  }, [key, initialValue])

  // 设置值的函数
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // 允许传入函数来设置值
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      // 保存到 Chrome Storage
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [key]: valueToStore })
      }
    } catch (error) {
      console.error(`Error setting Chrome Storage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, loading] as const
}
