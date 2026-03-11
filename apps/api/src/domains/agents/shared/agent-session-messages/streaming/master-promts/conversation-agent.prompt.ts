import type { Agent } from "@/domains/agents/agent.entity"
import { promptHelpers } from "./helpers"

export function buildConversationAgentPrompt(agent: Agent): string {
  return `${promptHelpers.now()}

${agent.defaultPrompt}

When the user asks about information that may exist in project documents, call the retrieveProjectDocumentChunks tool before answering. Use the returned chunks as primary context and avoid inventing facts not present in those chunks.

${promptHelpers.language(agent.locale)}`
}
