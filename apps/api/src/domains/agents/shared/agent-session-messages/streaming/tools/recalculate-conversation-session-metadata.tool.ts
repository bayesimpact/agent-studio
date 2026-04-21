import { ToolName } from "@caseai-connect/api-contracts"
import { tool } from "ai"
import { z } from "zod"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { ConversationAgentSessionsService } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service"
import type { ToolExecutionLog } from "./tool-execution-log"

export function recalculateConversationSessionMetadataTool({
  connectScope,
  sessionId,
  availableCategoryNames,
  currentCategoryNames,
  conversationAgentSessionsService,
  onExecute,
}: {
  connectScope: RequiredConnectScope
  sessionId: string
  availableCategoryNames: string[]
  currentCategoryNames: string[]
  conversationAgentSessionsService: ConversationAgentSessionsService
  onExecute: (toolExecution: ToolExecutionLog) => void
}) {
  const categoryNameSchema =
    availableCategoryNames.length > 0
      ? z.enum(availableCategoryNames as [string, ...string[]])
      : z.string()

  const normalizedCurrentCategoryNames = currentCategoryNames.filter((currentCategoryName) =>
    availableCategoryNames.includes(currentCategoryName),
  )

  const availableCategoriesDescription =
    availableCategoryNames.length > 0
      ? `Available categories for this agent: ${availableCategoryNames.join(", ")}.`
      : "No categories are configured for this agent."

  return tool({
    description:
      "Pick relevant categories from the available list and optionally suggest a session title. Return the full category set that should remain on the session, not just newly detected categories.",
    inputSchema: z.object({
      currentCategoryNames: z
        .array(categoryNameSchema)
        .default(normalizedCurrentCategoryNames)
        .describe(
          "Current categories already attached to the session. Keep still-relevant categories in categoryNames.",
        ),
      suggestedTitle: z
        .string()
        .trim()
        .max(120)
        .nullable()
        .describe("A concise session title suggestion. Can be null when no good title exists."),
      categoryNames: z
        .array(categoryNameSchema)
        .max(5)
        .describe(
          `${availableCategoriesDescription} Return the complete set to keep on session after this turn. Return an empty array when none apply.`,
        ),
    }),
    outputSchema: z.object({
      suggestedTitle: z.string().nullable(),
      categoryNames: z.array(z.string()),
    }),
    execute: async (input) => {
      const { suggestedTitle, selectedCategoryNames } =
        await conversationAgentSessionsService.recalculateSessionMetadataFromMessages({
          connectScope,
          sessionId,
          selectedCategoryNames: input.categoryNames,
          suggestedTitle: input.suggestedTitle,
        })

      onExecute({
        toolName: ToolName.RecalculateConversationSessionMetadata,
        arguments: {
          suggestedTitle,
          categoryNames: selectedCategoryNames,
        },
      })

      return {
        suggestedTitle,
        categoryNames: selectedCategoryNames,
      }
    },
  })
}
