import type { Agent } from "@/domains/agents/agent.entity"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import { promptHelpers } from "./helpers"

export function buildConversationAgentPrompt({
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
  epilogue?: string
}): string {
  // Keep the volatile timestamp at the very end so everything above it —
  // the epilogue included — forms a byte-stable prefix that Vertex/Gemini
  // implicit caching can reuse across runs (putting the daily-changing date
  // earlier would invalidate the cached prefix on every date rollover). The
  // epilogue — the turn-summary response protocol — is the last authored
  // section, right before that date line: recency is the strongest lever for
  // the voluntary call on big prompts.
  return `${agentSettings.instructions}

${promptHelpers.resourceLibraries(agent.resourceLibraries ?? [])}

${promptHelpers.tools({ names: toolNames, descriptions: toolDescriptions, agentSettings })}

${promptHelpers.mcpAppUis(toolDescriptions)}

${promptHelpers.language(agentSettings.locale)}
${epilogue ? `\n${epilogue}\n` : ""}
${promptHelpers.now()}`
}
