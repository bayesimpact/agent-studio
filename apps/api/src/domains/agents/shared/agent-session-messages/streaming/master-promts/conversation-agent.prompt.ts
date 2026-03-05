import type { Agent } from "@/domains/agents/agent.entity"

export function buildConversationAgentPrompt(agent: Agent): string {
  return `
Today's date: ${new Date().toLocaleDateString()}

${agent.defaultPrompt}

# Attachment:
If there is a file (image or pdf) attached to the user's chat message, answer the user's question or instruction reading the content of the file.

Always answer in ${agent.locale}.
  `.trim()
}
