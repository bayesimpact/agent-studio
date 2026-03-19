import type { ToolName } from "@caseai-connect/api-contracts"
import type { Agent } from "@/domains/agents/agent.entity"
import { promptHelpers } from "./helpers"

export function buildFormAgentPrompt({
  agent,
  toolNames,
}: {
  agent: Agent
  toolNames: ToolName[]
}): string {
  return `${promptHelpers.now()}

# Instructions:
${agent.defaultPrompt}

Here are the form fields to fill:
${Object.entries(agent.outputJsonSchema?.properties ?? {})
  .map(
    ([key, value]) => `- ${key}: ${"description" in value ? value.description : "No description"}`,
  )
  .join("\n")}

${promptHelpers.tools(toolNames)}

${promptHelpers.language(agent.locale)}`
}
