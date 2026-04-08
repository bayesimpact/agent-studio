import { BotIcon, BotMessageSquareIcon, FormIcon, ScanText } from "lucide-react"
import type { Agent } from "../agents.models"

export function getAgentIcon(agentType: Agent["type"]) {
  return agentType === "extraction"
    ? ScanText
    : agentType === "form"
      ? FormIcon
      : agentType === "conversation"
        ? BotMessageSquareIcon
        : BotIcon
}
