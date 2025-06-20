import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { userProfileAction } from "../api/messages"
import type { UserSettings } from "../types/settings"
import type { UserProfile } from "./use-user-profile"

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const response = await userProfileAction({
        action: "updateUserSettings",
        data: newSettings
      })

      if (!response.success) {
        throw new Error(response.error || "更新设置失败")
      }

      return response.data
    },
    onSuccess: (updatedSettings) => {
      // 更新缓存中的设置
      queryClient.setQueryData(["userProfile"], (oldData: UserProfile) => ({
        ...oldData,
        settings: updatedSettings,
        lastSyncAt: Date.now()
      }))

      toast.success("设置已保存")
    },
    onError: (error: Error) => {
      console.error("Failed to update settings:", error)
      toast.error(error.message || "保存设置失败")
    }
  })
}
