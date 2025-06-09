/**
 * 事件处理工具函数
 *
 * 提供便捷的方法来阻止 React 事件的传播和默认行为
 *
 * @example
 * ```tsx
 * // 方式1: 使用预设对象
 * <div {...eventStoppers.all}>内容</div>
 *
 * // 方式2: 使用单个函数
 * <div onKeyDown={eventStoppers.stop}>内容</div>
 *
 * // 方式3: 阻止默认行为
 * <div onWheel={eventStoppers.stopAndPrevent}>内容</div>
 *
 * // 方式4: 自定义组合
 * <div {...eventStoppers.keyboard} onWheel={eventStoppers.stopAndPrevent}>内容</div>
 * ```
 */

/**
 * 阻止事件传播和冒泡的通用函数
 * @param event React 合成事件或原生事件
 * @param preventDefault 是否同时阻止默认行为
 */
export function stopEvent(
  event: React.SyntheticEvent | Event,
  preventDefault = false
) {
  event.stopPropagation()
  if (preventDefault) {
    event.preventDefault()
  }
}

/**
 * 创建一个阻止事件传播的处理函数
 * @param preventDefault 是否同时阻止默认行为，默认为 false
 */
export function createEventStopper(preventDefault = false) {
  return (event: React.SyntheticEvent) => {
    stopEvent(event, preventDefault)
  }
}

/**
 * 常用的事件阻止器预设
 *
 * 提供了多种预设的事件阻止器，可以直接使用或组合使用
 */
export const eventStoppers = {
  /** 阻止事件传播 */
  stop: createEventStopper(),

  /** 阻止事件传播并阻止默认行为 */
  stopAndPrevent: createEventStopper(true),

  /** 所有交互事件的阻止器对象 */
  all: {
    onKeyDown: createEventStopper(),
    onKeyUp: createEventStopper(),
    onKeyPress: createEventStopper(),
    onWheel: createEventStopper(),
    onTouchMove: createEventStopper()
  },

  /** 只阻止键盘事件 */
  keyboard: {
    onKeyDown: createEventStopper(),
    onKeyUp: createEventStopper(),
    onKeyPress: createEventStopper()
  },

  /** 阻止滚动和触摸事件（并阻止默认行为） */
  scrollTouch: {
    onWheel: createEventStopper(true),
    onTouchMove: createEventStopper(true)
  }
}
