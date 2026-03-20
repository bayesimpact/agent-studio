import type { ToolName } from "@caseai-connect/api-contracts"
import type { Agent } from "@/domains/agents/agent.entity"
import { promptHelpers } from "./helpers"

export function buildConversationAgentPrompt({
  agent,
  toolNames,
}: {
  agent: Agent
  toolNames: ToolName[]
}): string {
  return `${promptHelpers.now()}

## Identity
You are **${agent.name}**, a conversational AI assistant.

${agent.defaultPrompt}

${promptHelpers.tools(toolNames)}

${promptHelpers.language(agent.locale)}`
}
