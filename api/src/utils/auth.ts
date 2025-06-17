import { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { verify } from "hono/jwt"

// 从JWT中获取用户ID
export const getUserId = (c: Context): string => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "认证令牌缺失或格式不正确" })
  }

  const token = authHeader.substring(7)
  try {
    const payload = c.get("jwtPayload")
    if (!payload || !payload.userId) {
      throw new HTTPException(401, { message: "无效的认证令牌" })
    }
    return payload.userId
  } catch (error) {
    throw new HTTPException(401, { message: "认证令牌验证失败" })
  }
}

// 检查团队成员权限
export const checkTeamPermission = async (
  db: any,
  teamId: string,
  userId: string,
  requiredRoles: string[] = ["owner", "admin", "member"]
): Promise<{ role: string; settings: any }> => {
  const member = (await db
    .prepare(
      `SELECT tm.role, t.settings 
       FROM team_members tm 
       JOIN teams t ON t.id = tm.team_id 
       WHERE tm.team_id = ? AND tm.user_id = ?`
    )
    .bind(teamId, userId)
    .first()) as { role: string; settings: string } | null

  if (!member) {
    throw new HTTPException(403, { message: "您不是该团队的成员" })
  }

  if (!requiredRoles.includes(member.role)) {
    throw new HTTPException(403, { message: "权限不足" })
  }

  return {
    role: member.role,
    settings: JSON.parse(member.settings)
  }
}

// 检查是否为团队所有者
export const checkTeamOwner = async (
  db: any,
  teamId: string,
  userId: string
): Promise<void> => {
  const team = (await db
    .prepare("SELECT owner_id FROM teams WHERE id = ?")
    .bind(teamId)
    .first()) as { owner_id: string } | null

  if (!team) {
    throw new HTTPException(404, { message: "团队不存在" })
  }

  if (team.owner_id !== userId) {
    throw new HTTPException(403, { message: "只有团队所有者可以执行此操作" })
  }
}

// 检查是否为团队管理员或所有者
export const checkTeamAdmin = async (
  db: any,
  teamId: string,
  userId: string
): Promise<{ role: string; settings: any }> => {
  return checkTeamPermission(db, teamId, userId, ["owner", "admin"])
}
