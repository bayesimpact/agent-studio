import type {
  AgentLocale,
  AgentModel,
  AgentTemperature,
  TimeType,
} from "@caseai-connect/api-contracts"
import z from "zod"

export type Agent = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: AgentLocale
  model: AgentModel
  name: string
  projectId: string
  temperature: AgentTemperature
  updatedAt: TimeType
}

export const agentSchema = z
  .object({
    createdAt: z.number(),
    defaultPrompt: z.string(),
    id: z.string(),
    locale: z.string(),
    model: z.string(),
    name: z.string(),
    temperature: z.number(),
    updatedAt: z.number(),
  })
  .strict()
