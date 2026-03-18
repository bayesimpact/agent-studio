import type { Agent } from "@/domains/agents/agent.entity"
import type { ToolName } from "../tools/tool-execution-log"
import { promptHelpers } from "./helpers"

export function buildConversationAgentPrompt({
  agent,
  toolNames,
}: {
  agent: Agent
  toolNames: ToolName[]
}): string {
  return `${promptHelpers.now()}

${agent.defaultPrompt}

${promptHelpers.tools(toolNames)}

${promptHelpers.language(agent.locale)}`
}
