import type { AgentMessageMcpApp } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"

export type ToolExecutionLog = {
  toolName: string
  notifyToolName?: string
  arguments: Record<string, unknown>
  result?: unknown
  mcpApp?: AgentMessageMcpApp
}
