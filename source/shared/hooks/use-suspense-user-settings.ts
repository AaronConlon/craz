import { useSuspenseQuery } from "@tanstack/react-query"

import { userProfileAction } from "../api/messages"
import type { UserProfile } from "./use-user-profile"

export function useSuspenseUserSettings() {
  const query = useSuspenseQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfile> => {
      const response = await userProfileAction({
        action: "getUserProfile"
      })

      if (!response.success) {
        throw new Error(response.error || "获取用户配置文件失败")
      }

      return response.data
    }
  })

  // 为了兼容现有代码，返回data包装
  return {
    data: {
      settings: query.data.settings,
      authStatus: query.data.authStatus,
      isDefault: !query.data.user
    }
  }
}
