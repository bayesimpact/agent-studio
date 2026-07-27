import type { AgentDto } from "@caseai-connect/api-contracts"
import z from "zod"

export type Agent = AgentDto

export const agentSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    type: z.enum(["conversation", "extraction"]),
    createdAt: z.number(),
    updatedAt: z.number(),
    hasCategories: z.boolean().optional(),
    documentTagIds: z.array(z.string()),
    resourceLibraryIds: z.array(z.string()),
    projectAgentSessionCategoryIds: z.array(z.string()),
    usedProjectAgentSessionCategoryIds: z.array(z.string()),
    mcpServers: z.array(z.object({ id: z.string(), name: z.string(), enabled: z.boolean() })),
  })
  .strict()
