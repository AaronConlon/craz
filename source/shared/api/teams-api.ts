import { BaseApiClient } from "./base-client"
import type {
  ApiResponse,
  CreateTeamDto,
  Team,
  TeamMember,
  UpdateTeamDto
} from "./types"

export class TeamsApi extends BaseApiClient {
  /**
   * 获取用户的团队列表
   */
  async getTeams(): Promise<Team[]> {
    return await this.get<Team[]>("api/teams")
  }

  /**
   * 获取单个团队信息
   */
  async getTeam(teamId: string): Promise<ApiResponse<Team>> {
    return await this.get<ApiResponse<Team>>(`api/teams/${teamId}`)
  }

  /**
   * 创建团队
   */
  async createTeam(data: CreateTeamDto): Promise<ApiResponse<{ id: string }>> {
    return await this.post<ApiResponse<{ id: string }>>("api/teams", data)
  }

  /**
   * 更新团队信息
   */
  async updateTeam(
    teamId: string,
    data: UpdateTeamDto
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.put<ApiResponse<{ affected: number }>>(
      `api/teams/${teamId}`,
      data
    )
  }

  /**
   * 删除团队
   */
  async deleteTeam(teamId: string): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      `api/teams/${teamId}`
    )
  }

  // 团队成员管理

  /**
   * 获取团队成员列表
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await this.get<TeamMember[]>(`api/teams/${teamId}/members`)
  }

  /**
   * 邀请成员加入团队
   */
  async inviteMember(
    teamId: string,
    data: {
      email: string
      role?: "admin" | "member"
    }
  ): Promise<ApiResponse<{ id: string }>> {
    return await this.post<ApiResponse<{ id: string }>>(
      `api/teams/${teamId}/members`,
      data
    )
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    role: "admin" | "member"
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.put<ApiResponse<{ affected: number }>>(
      `api/teams/${teamId}/members/${memberId}`,
      { role }
    )
  }

  /**
   * 移除团队成员
   */
  async removeMember(
    teamId: string,
    memberId: string
  ): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      `api/teams/${teamId}/members/${memberId}`
    )
  }

  /**
   * 离开团队
   */
  async leaveTeam(teamId: string): Promise<ApiResponse<{ affected: number }>> {
    return await this.delete<ApiResponse<{ affected: number }>>(
      `api/teams/${teamId}/leave`
    )
  }

  // 实用方法

  /**
   * 检查用户在团队中的权限
   */
  async checkTeamPermission(teamId: string): Promise<{
    canEdit: boolean
    canInvite: boolean
    canManage: boolean
    role: "owner" | "admin" | "member" | null
  }> {
    try {
      const members = await this.getTeamMembers(teamId)
      const currentUser = members.find((member) => member.userId === "current") // 需要从认证状态获取当前用户ID

      if (!currentUser) {
        return {
          canEdit: false,
          canInvite: false,
          canManage: false,
          role: null
        }
      }

      const teamResponse = await this.getTeam(teamId)
      const team = teamResponse.data

      if (!team) {
        return {
          canEdit: false,
          canInvite: false,
          canManage: false,
          role: currentUser.role
        }
      }

      const isOwnerOrAdmin =
        currentUser.role === "owner" || currentUser.role === "admin"
      const canEdit = isOwnerOrAdmin || team.settings.allowMemberEdit
      const canInvite = isOwnerOrAdmin || team.settings.allowMemberInvite

      return {
        canEdit,
        canInvite,
        canManage: isOwnerOrAdmin,
        role: currentUser.role
      }
    } catch (error) {
      return {
        canEdit: false,
        canInvite: false,
        canManage: false,
        role: null
      }
    }
  }

  /**
   * 获取用户拥有的团队
   */
  async getOwnedTeams(): Promise<Team[]> {
    const teams = await this.getTeams()
    // 需要结合成员信息来筛选拥有的团队
    const ownedTeams: Team[] = []

    for (const team of teams) {
      try {
        const members = await this.getTeamMembers(team.id)
        const isOwner = members.some(
          (member) => member.userId === "current" && member.role === "owner" // 需要从认证状态获取当前用户ID
        )

        if (isOwner) {
          ownedTeams.push(team)
        }
      } catch (error) {
        console.error(`获取团队 ${team.id} 成员信息失败:`, error)
      }
    }

    return ownedTeams
  }

  /**
   * 搜索团队
   */
  async searchTeams(query: string): Promise<Team[]> {
    const teams = await this.getTeams()

    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        (team.description &&
          team.description.toLowerCase().includes(query.toLowerCase()))
    )
  }
}
