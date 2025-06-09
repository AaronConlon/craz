import { sendToBackground } from "@plasmohq/messaging"

import type {
  CloseTabRequest,
  CloseTabResponse
} from "../../../background/messages/close-tab"
import type {
  GetTabsRequest,
  GetTabsResponse
} from "../../../background/messages/get-tabs"
import type {
  SwitchTabRequest,
  SwitchTabResponse
} from "../../../background/messages/switch-tab"

/**
 * Messaging API 服务
 *
 * 架构说明：
 * - 封装所有与 background script 的通信
 * - 提供类型安全的消息发送接口
 * - UI 组件通过此模块与 background 通信，获取 Chrome API 数据
 * - 遵循 UI → Messages → Background → Chrome API 的数据流向
 */

/**
 * 获取所有标签页
 */
export const getTabs = async (
  request: GetTabsRequest = {}
): Promise<GetTabsResponse> => {
  return await sendToBackground<GetTabsRequest, GetTabsResponse>({
    body: request,
    name: "get-tabs"
  })
}

/**
 * 切换到指定标签页
 */
export const switchToTab = async (
  request: SwitchTabRequest
): Promise<SwitchTabResponse> => {
  return await sendToBackground<SwitchTabRequest, SwitchTabResponse>({
    name: "switch-tab",
    body: request
  })
}

/**
 * 关闭指定标签页
 */
export const closeTab = async (
  request: CloseTabRequest
): Promise<CloseTabResponse> => {
  return await sendToBackground<CloseTabRequest, CloseTabResponse>({
    name: "close-tab",
    body: request
  })
}
