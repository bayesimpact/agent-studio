import type { TimeType } from "../generic"

export type ProjectMembershipDto = {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: TimeType
}
