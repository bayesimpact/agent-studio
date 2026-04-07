import type { AgentMembershipRoleDto, TimeType } from "@caseai-connect/api-contracts"

export type AgentMembership = {
  id: string
  agentId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: TimeType
  role: AgentMembershipRoleDto
}
