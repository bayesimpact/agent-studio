import {
  getOrderedPropertyEntries,
  outputJsonSchemaSchema,
  ToolName,
} from "@caseai-connect/api-contracts"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import type { ResourceLibrary } from "@/domains/resource-libraries/resource-library.entity"
import { buildResourceLink } from "@/domains/resource-libraries/resource-library-link.helper"

export const promptHelpers = {
  now: () => `Today's date: ${new Date().toLocaleDateString()}`,

  resourceLibraries: (libraries: ResourceLibrary[]) => {
    const librariesWithResources = libraries.filter(
      (library) => (library.resources?.length ?? 0) > 0,
    )
    if (librariesWithResources.length === 0) return ""

    const serializedLibraries = librariesWithResources
      .map((library) => {
        const serializedResources = library.resources
          .map((resource) => {
            const link = buildResourceLink({
              resource,
              organizationId: library.organizationId,
              projectId: library.projectId,
              resourceLibraryId: library.id,
            })
            const matchingHintsLine = resource.matchingHints
              ? `\n    matching hints (for matching only, do NOT show to the user): ${resource.matchingHints}`
              : ""
            return `  - id: ${resource.id}\n    title: ${resource.title}\n    description: ${resource.description}${matchingHintsLine}\n    link: ${link}`
          })
          .join("\n")
        return `### ${library.title}\n${serializedResources}`
      })
      .join("\n\n")

    return `## Resource libraries:
You have access to the following resources. When the user's request matches a resource by its title, description, or matching hints, call the ${ToolName.SurfaceResources} tool with the matching resources (copy their id, title, description, and link verbatim — never copy the matching hints). Do not invent resources or links.

${serializedLibraries}`
  },

  language: (locale: string) =>
    `## Response language:
Always answer in ${locale === "en" ? "English" : locale === "fr" ? "French" : "user's language"}.
      `.trim(),

  tools: ({
    agentSettings,
    names,
    descriptions = {},
  }: {
    names: string[]
    descriptions?: Record<string, string>
    agentSettings: AgentSettings
  }) =>
    names.length === 0
      ? ""
      : `## Tools:
${names
  .map((name) => {
    switch (name) {
      case ToolName.LookupKnowledgeBase:
        return `[${name}]: The knowledge base holds information that is not in your training data, so you do not know the answer to the user's question — assume you must look it up. Call the ${name} tool BEFORE replying to anything except greetings and questions about what was already said in this conversation, including follow-up questions and questions that feel familiar. Rewrite the question as a standalone sentence before passing it. Answer only from the returned passages; if they do not contain the answer, say so instead of inventing one. Each passage comes with a "ref" number — remember the refs of the passages you rely on.`

      case ToolName.Sources:
        return `[${name}]: Whenever you are going to answer from passages returned by the ${ToolName.LookupKnowledgeBase} tool, you MUST call the ${name} tool with the "ref" numbers of EVERY passage you use — for example {"refs": [1, 4]}. Call it as soon as you have read the passages, BEFORE writing your answer, then write your answer. Refs are all it takes: documents, titles and quotes are attached for you, so never pass ids, titles or text. Do NOT cite sources inline in your text response and never mention refs to the user — the ${name} tool is the only way to show sources.`

      case ToolName.FillForm: {
        const parsedSchema = outputJsonSchemaSchema.safeParse(agentSettings.outputJsonSchema)
        const orderedFields = parsedSchema.success
          ? getOrderedPropertyEntries(parsedSchema.data)
          : []
        return `[${name}]: Use the ${name} tool to fill the form progressively. Call it with getFormState: true at any time — including alongside partial field updates — to retrieve the current form state and know which fields are already filled. Only pass fields that are new or have changed — never re-send fields already stored. Ask the user for any missing information until the form is complete. Ask the questions in the order listed below. To avoid overwhelming the user, ask one question at a time. However, keep in mind that a single answer may contain values for multiple form fields — be sure to capture every detail and save all of them in the form. From each user response, extract and fill as many fields as possible. Update any field whenever the user revises a previous answer. If a user response is unclear or doesn't map to any field, ask them to clarify or rephrase. Form fields:
${orderedFields
  .map(([key, value]) => {
    const hints: string[] = []
    if (value.enum && value.enum.length > 0) hints.push(`allowed values: ${value.enum.join(", ")}`)
    if (value.minimum !== undefined) hints.push(`minimum: ${value.minimum}`)
    if (value.maximum !== undefined) hints.push(`maximum: ${value.maximum}`)
    const hintSuffix = hints.length > 0 ? ` (${hints.join("; ")})` : ""
    return `- ${key}: ${value.description ?? "No description"}${hintSuffix}`
  })
  .join("\n")}\n\n`
      }

      case ToolName.RecalculateConversationSessionMetadata:
        return `[${name}]: Call this tool after answering the user so session metadata stays aligned. Return the full category set that should remain on the session (including categories still relevant from earlier turns), not only categories from the latest message.`

      case ToolName.McpSearchResources:
        return `[${name}]: Search for workforce and social resources from a specific source (datainclusion, francetravail-jobs, francetravail-events, francetravail-labonneboite). Returns raw results without AI processing. Use this when the user asks about a specific type of resource.`

      case ToolName.McpSmartSearch:
        return `[${name}]: AI-powered search across multiple workforce and social sources. Rewrites the query for better results and reranks by relevance. Use this when the user's question spans multiple resource types or when you want the best results across all sources.`

      case ToolName.SurfaceResources:
        return `[${name}]: Call ${name} tool whenever the user's request matches a resource in the resource libraries (by title or description or matchingHints). Pass the matching resources, copying their id, title, description, and link verbatim. Do not surface resources that are not relevant to the user's request.`

      default:
        if (descriptions[name]) return `[${name}]: ${descriptions[name]}`
        return `[${name}]: No specific instructions for this tool.`
    }
  })
  .join("\n")}`,
}
