import { z } from "zod"
import { documentTagSchema, updateDocumentTagsSchema } from "../document-tags/document-tag.dto"
import { timeTypeSchema } from "../generic"

export enum AgentModel {
  Gemini25Flash = "gemini-2.5-flash",
  Gemini25Pro = "gemini-2.5-pro",
  _MockGenerateObject = "generate-object-mock-language-model-v3",
  _MockGenerateStructuredOutput = "generate-structured-output-mock-language-model-v3",
  _MockGenerateText = "generate-text-mock-language-model-v3",
  _MockProcessFiles = "process-files-mock-language-model-v3",
  _MockRate = "rate-mock-language-model-v3",
  _MockStreamChatResponse = "stream-chat-response-mock-language-model-v3",
}

export enum AgentLocale {
  EN = "en",
  FR = "fr",
}

export const outputJsonSchemaSchema = z
  .object({
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

export const agentSchema = z.object({
  createdAt: timeTypeSchema,
  defaultPrompt: z.string(),
  documentTagIds: z.array(documentTagSchema.shape.id),
  id: z.string(),
  locale: z.enum(AgentLocale),
  model: z.enum(AgentModel),
  name: z.string().trim().min(2),
  outputJsonSchema: outputJsonSchemaSchema.optional(),
  projectId: z.string(),
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
  updatedAt: timeTypeSchema,
})

export type AgentDto = z.infer<typeof agentSchema>

export type AgentType = AgentDto["type"]
export type AgentTemperature = AgentDto["temperature"] // e.g., 0.7 float value

const refineOutputJsonSchema = {
  fn: (data: Partial<AgentDto>) =>
    data.type === "conversation" || data.outputJsonSchema !== undefined,
  message: {
    message: "outputJsonSchema is required when type is not 'conversation'",
    path: ["outputJsonSchema"],
  },
}

export const createAgentSchema = agentSchema
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

export const updateAgentSchema = agentSchema
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
  .refine(refineOutputJsonSchema.fn, refineOutputJsonSchema.message)

export type CreateAgentDto = z.infer<typeof createAgentSchema>
export type UpdateAgentDto = z.infer<typeof updateAgentSchema>
