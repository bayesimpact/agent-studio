import type { TimeType } from "@caseai-connect/api-contracts"
import z from "zod"

export type DocumentTag = {
  createdAt: TimeType
  description: string | null
  id: string
  name: string
  organizationId: string
  parentId: string | null
  projectId: string
  updatedAt: TimeType
}

export const documentTagSchema = z
  .object({
    createdAt: z.number(),
    description: z.string().nullable(),
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    parentId: z.string().nullable(),
    projectId: z.string(),
    updatedAt: z.number(),
  })
  .strict()
