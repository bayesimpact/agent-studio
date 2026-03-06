import type { Agent } from "@/domains/agents/agent.entity"

export function buildConversationAgentPrompt(agent: Agent): string {
  return `
Today's date: ${new Date().toLocaleDateString()}

${agent.defaultPrompt}

Always answer in ${agent.locale}.
  `.trim()
}
