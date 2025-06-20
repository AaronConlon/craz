import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CloseTabRequest } from "~background/messages/close-tab"
import type { GetTabsRequest } from "~background/messages/get-tabs"
import type { PingRequest } from "~background/messages/ping"
import type { SwitchTabRequest } from "~background/messages/switch-tab"
import { closeTab, getTabs, switchToTab } from "~source/shared/api/messages"

/**
 * 查询标签页列表
 */
export const useTabs = (params: GetTabsRequest = {}) => {
  return useQuery({
    queryKey: ["tabs", params],
    queryFn: () => getTabs(params),
    staleTime: 1000, // 1秒内认为数据是新鲜的
    refetchInterval: 2000 // 每2秒自动刷新
  })
}

/**
 * 切换标签页的mutation
 */
export const useSwitchTab = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SwitchTabRequest) => switchToTab(params),
    onSuccess: () => {
      // 切换成功后刷新标签页列表
      queryClient.invalidateQueries({ queryKey: ["tabs"] })
    }
  })
}

/**
 * 关闭标签页的mutation
 */
export const useCloseTab = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CloseTabRequest) => closeTab(params),
    onSuccess: () => {
      // 关闭成功后刷新标签页列表
      queryClient.invalidateQueries({ queryKey: ["tabs"] })
    }
  })
}

/**
 * 获取当前活动标签页
 */
export const useActiveTab = () => {
  return useQuery({
    queryKey: ["tabs", { activeOnly: true, currentWindow: true }],
    queryFn: () => getTabs({ activeOnly: true, currentWindow: true }),
    staleTime: 500
  })
}
