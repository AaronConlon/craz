/**
 * 键盘事件工具函数
 */

/**
 * 检查是否按下了任何修饰键
 * @param event 键盘事件
 * @returns 是否按下了修饰键（Ctrl、Alt、Shift、Meta）
 */
export function hasModifierKeys(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey
}

/**
 * 检查是否是纯按键（没有修饰键）
 * @param event 键盘事件
 * @param key 要检查的按键（支持大小写）
 * @returns 是否是指定的纯按键
 */
export function isPureKey(event: KeyboardEvent, key: string): boolean {
  const targetKey = key.toLowerCase()
  const eventKey = event.key.toLowerCase()
  return eventKey === targetKey && !hasModifierKeys(event)
}

/**
 * 检查是否是指定的组合键
 * @param event 键盘事件
 * @param key 主按键
 * @param modifiers 修饰键配置
 * @returns 是否匹配指定的组合键
 */
export function isHotkey(
  event: KeyboardEvent,
  key: string,
  modifiers: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  } = {}
): boolean {
  const targetKey = key.toLowerCase()
  const eventKey = event.key.toLowerCase()

  return (
    eventKey === targetKey &&
    !!event.ctrlKey === !!modifiers.ctrl &&
    !!event.altKey === !!modifiers.alt &&
    !!event.shiftKey === !!modifiers.shift &&
    !!event.metaKey === !!modifiers.meta
  )
}

/**
 * 常用快捷键检查器
 */
export const keyCheckers = {
  /** 检查是否是纯 c 键（没有修饰键） */
  isPureC: (event: KeyboardEvent) => isPureKey(event, "c"),

  /** 检查是否是 ESC 键 */
  isEscape: (event: KeyboardEvent) => event.key === "Escape",

  /** 检查是否是 Ctrl+C */
  isCtrlC: (event: KeyboardEvent) => isHotkey(event, "c", { ctrl: true }),

  /** 检查是否是 Cmd+C (macOS) */
  isCmdC: (event: KeyboardEvent) => isHotkey(event, "c", { meta: true }),

  /** 检查是否是复制快捷键（Ctrl+C 或 Cmd+C） */
  isCopy: (event: KeyboardEvent) =>
    keyCheckers.isCtrlC(event) || keyCheckers.isCmdC(event)
}
