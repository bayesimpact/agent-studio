import type { TimeType } from "../generic"

export type AgentMembershipRoleDto = "owner" | "admin" | "member"

export type AgentMembershipDto = {
  id: string
  agentId: string
  userId: string
  userName: string | null
  userEmail: string
  role: AgentMembershipRoleDto
  status: "sent" | "accepted"
  createdAt: TimeType
}
