import { z } from "zod"
import {
  type DocumentTagDto,
  documentTagSchema,
  updateDocumentTagsSchema,
} from "../document-tags/document-tag.dto"
import type { TimeType } from "../generic"

export enum AgentModel {
  Gemini25Flash = "gemini-2.5-flash",
  Gemini25Pro = "gemini-2.5-pro",
  MedGemma10_27B = "google/medgemma-27b-it",
  MedGemma15_4B = "google/medgemma-1.5-4b-it",
  _MockGenerateObject = "generate-object-mock-language-model-v3",
  _MockGenerateStructuredOutput = "generate-structured-output-mock-language-model-v3",
  _MockGenerateText = "generate-text-mock-language-model-v3",
  _MockRate = "rate-mock-language-model-v3",
  _MockStreamChatResponse = "stream-chat-response-mock-language-model-v3",
}
export enum AgentLocale {
  EN = "en",
  FR = "fr",
}

export type AgentDto = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: AgentLocale
  model: AgentModel
  name: string
  outputJsonSchema?: Record<string, unknown>
  projectId: string
  temperature: AgentTemperature
  type: AgentType
  updatedAt: TimeType
  documentTagIds: DocumentTagDto["id"][]
}

export const outputJsonSchemaSchema = z
  .object({
    type: z.literal("object"),
    required: z.array(z.string()).optional(),
    properties: z.record(
      z.string(),
      z.object({
        type: z.enum(["string", "number", "boolean", "object", "array"]),
        description: z.string().optional(),
      }),
    ),
  })
  .refine((data) => {
    if (data.required) {
      return data.required.every((requiredKey) => requiredKey in data.properties)
    }
    return true
  }, "All required keys must be defined in properties")

const agentValidationSchema = z.object({
  defaultPrompt: z.string(),
  documentTagIds: z.array(documentTagSchema.shape.id),
  locale: z.enum(AgentLocale),
  model: z.enum(AgentModel),
  name: z.string().trim().min(2),
  outputJsonSchema: outputJsonSchemaSchema.optional(),
  temperature: z
    .float32()
    .min(0)
    .max(2)
    .refine(
      (temperatureValue) =>
        temperatureValue >= 0 && temperatureValue <= 2 && Number.isFinite(temperatureValue),
      "Temperature must be between 0.0 and 2.0",
    ),
  type: z.enum(["conversation", "extraction", "form"]),
})

export type AgentType = z.infer<typeof agentValidationSchema.shape.type>
export type AgentTemperature = z.infer<typeof agentValidationSchema.shape.temperature>

const refineOutputJsonSchema = {
  fn: (data: Partial<AgentDto>) =>
    data.type === "conversation" || data.outputJsonSchema !== undefined,
  message: {
    message: "outputJsonSchema is required when type is not 'conversation'",
    path: ["outputJsonSchema"],
  },
}

export const createAgentSchema = agentValidationSchema
  .pick({
    defaultPrompt: true,
    locale: true,
    model: true,
    name: true,
    outputJsonSchema: true,
    temperature: true,
    type: true,
  })
  .extend({
    tagsToAdd: updateDocumentTagsSchema.required().shape.tagsToAdd,
  })
  .refine(refineOutputJsonSchema.fn, refineOutputJsonSchema.message)

export const updateAgentSchema = agentValidationSchema
  .pick({
    defaultPrompt: true,
    documentTagIds: true,
    locale: true,
    model: true,
    name: true,
    outputJsonSchema: true,
    temperature: true,
  })
  .extend({
    tagsToAdd: updateDocumentTagsSchema.required().shape.tagsToAdd,
    tagsToRemove: updateDocumentTagsSchema.required().shape.tagsToRemove,
  })

export type CreateAgentDto = z.infer<typeof createAgentSchema>
export type UpdateAgentDto = z.infer<typeof updateAgentSchema>
