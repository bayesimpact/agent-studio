import type { McpServerAuthStatus } from "@caseai-connect/api-contracts"

export type McpServerDisplay = {
  id: string
  name: string
  url: string
  projectId: string
  authStatus: McpServerAuthStatus
  createdAt: number
  updatedAt: number
}
