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
  // Keep the volatile timestamp NEAR the end so the stable content above
  // forms a byte-stable prefix that Vertex/Gemini implicit caching can reuse
  // across runs (putting the daily-changing date first would invalidate the
  // whole cached prefix on every date rollover). The epilogue — the
  // turn-summary response protocol — comes LAST on purpose: recency is the
  // strongest lever for the voluntary call on big prompts, and being a
  // small static block after the date it costs one cache-miss line a day.
  return `${agentSettings.instructions}

${promptHelpers.resourceLibraries(agent.resourceLibraries ?? [])}

${promptHelpers.tools({ names: toolNames, descriptions: toolDescriptions, agentSettings })}

${promptHelpers.language(agentSettings.locale)}

${promptHelpers.now()}${
  epilogue
    ? `

${epilogue}`
    : ""
}`
}
