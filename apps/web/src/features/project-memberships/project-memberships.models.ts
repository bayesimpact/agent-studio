import type { TimeType } from "@caseai-connect/api-contracts"

export type ProjectMembership = {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: TimeType
}
