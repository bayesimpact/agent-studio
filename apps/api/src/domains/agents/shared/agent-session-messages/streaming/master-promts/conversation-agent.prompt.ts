import type { Agent } from "@/domains/agents/agent.entity"
import { promptHelpers } from "./helpers"

export function buildConversationAgentPrompt(agent: Agent): string {
  return `${promptHelpers.now}

${agent.defaultPrompt}

${promptHelpers.language(agent.locale)}`
}
