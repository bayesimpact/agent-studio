import type { Agent } from "@/domains/agents/agent.entity"
import { promptHelpers } from "./helpers"

// FIXME: add ${agent.defaultPrompt}
export function buildFormAgentPrompt(agent: Agent): string {
  return `${promptHelpers.now}

# Instructions:
The user will fill out a form based on the above prompt. Your task is to help the user fill out the form by asking questions and providing guidance. Ask one question at a time to fill out the form.

Here are the form fields to fill:
${Object.entries(agent.outputJsonSchema?.properties ?? {})
  .map(
    ([key, value]) => `- ${key}: ${"description" in value ? value.description : "No description"}`,
  )
  .join("\n")}

# Tools:
You can use "fillForm" tool to fill out the form, even you don't have all the information now. Just fill out the information you have and ask the user for the missing information. You can also update previously filled information if the user changes their answer. Pass undefined for fields that are not filled yet.

${promptHelpers.language(agent.locale)}`
}
