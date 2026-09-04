import type { Agent } from "@/domains/agents/agent.entity"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import { buildConversationAgentPrompt } from "./conversation-agent.prompt"

export function generateMasterPrompt({
  agent,
  agentSettings,
  toolDescriptions,
  toolNames,
  epilogue,
}: {
  agent: Agent
  agentSettings: AgentSettings
  toolDescriptions?: Record<string, string>
  toolNames: string[]
  /** Last authored section, just before the date (e.g. the turn-summary protocol). */
  epilogue?: string
}): string {
  switch (agent.type) {
    case "conversation":
      return buildConversationAgentPrompt({
        agent,
        agentSettings,
        toolNames,
        toolDescriptions,
        epilogue,
      })
    default:
      throw new Error(`Unsupported agent type: ${agent.type}`)
  }
}
