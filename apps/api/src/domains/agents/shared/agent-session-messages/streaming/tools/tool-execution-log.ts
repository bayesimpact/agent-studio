import type { ToolName } from "@caseai-connect/api-contracts"

export type ToolExecutionLog = {
  toolName: ToolName
  arguments: Record<string, unknown>
}
