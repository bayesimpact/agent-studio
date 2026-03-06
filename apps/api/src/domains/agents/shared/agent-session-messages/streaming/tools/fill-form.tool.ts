import { tool } from "ai"
import { z } from "zod"
import type { Agent } from "@/domains/agents/agent.entity"

type AgentOutputJsonSchema = {
  required: string[]
  properties: Record<string, { type: string; description: string }>
}

export function fillFormTool({
  agent,
  onExecute,
}: {
  agent: Agent
  onExecute: (value: Record<string, unknown>) => void
}) {
  const isValid = isValidSchema(agent.outputJsonSchema)
  if (!isValid) {
    console.error(`Invalid output JSON schema for agent ${agent.id}`)
    return undefined
  }

  const agentOutputJsonSchema = agent.outputJsonSchema as AgentOutputJsonSchema
  const inputSchema = buildInputSchemaForFormTool(agentOutputJsonSchema.properties)

  return tool({
    description: "Fill out a form. Get the values from user's answers.",
    inputSchema,
    outputSchema: z.object({
      status: z.enum(["completed", "in_progress"]).describe("Whether the form is completed or not"),
      formState: inputSchema.describe(
        "The current state of the form, with values filled by the user",
      ),
    }),
    execute: async (input, _options) => {
      onExecute(input)

      const status = agentOutputJsonSchema.required.every((key) => key in input)
        ? "completed"
        : "in_progress"
      return {
        status,
        formState: input,
      }
    },
  })
}

// TODO: write a test for this method
function buildInputSchemaForFormTool(
  properties: Record<string, { type: string; description: string }>,
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [key, value] of Object.entries(properties)) {
    switch (value.type) {
      case "string":
        shape[key] = z.string().describe(value.description).optional()
        break
      case "number":
        shape[key] = z.number().describe(value.description).optional()
        break
      case "boolean":
        shape[key] = z.boolean().describe(value.description).optional()
        break
      default:
        throw new Error(`Unsupported property type: ${value.type}`)
    }
  }
  return z.object(shape).strict()
}

// TODO: write a test for this method
function isValidSchema(schema: Record<string, unknown> | null): schema is {
  required: string[]
  properties: Record<string, { type: string; description: string }>
} {
  if (!schema) {
    return false
  }

  if (
    !Array.isArray(schema.required) ||
    !schema.required.every((item) => typeof item === "string")
  ) {
    return false
  }

  if (
    typeof schema.properties !== "object" ||
    schema.properties === null ||
    Array.isArray(schema.properties)
  ) {
    return false
  }

  return Object.values(schema.properties as Record<string, unknown>).every(
    (prop) =>
      typeof prop === "object" &&
      prop !== null &&
      typeof (prop as Record<string, unknown>).type === "string" &&
      typeof (prop as Record<string, unknown>).description === "string",
  )
}
