import { tool } from "ai"
import { z } from "zod"

export function fillFormTool({
  inputSchema,
  onExecute,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: Required for dynamic form schema
  inputSchema: z.ZodObject<any>
  onExecute: (value: Record<string, unknown>) => void
}) {
  return tool({
    description: "Fill out a form. Get the values from user's answers.",
    inputSchema,
    outputSchema: z.object({
      status: z.enum(["completed", "in_progress"]).describe("Whether the form is completed or not"),
      formState: inputSchema.describe(
        "The current state of the form, with values filled by the user",
      ),
    }),
    // OUTPUT: { statusForm: "completed" | "in_progress", textForLLM: string, formState: { cigaretteCount: 3, alcoholicDrinkCount: undefined } }
    execute: async (input, _options) => {
      onExecute(input)
      return {
        // FIXME:
        status: "in_progress",
        formState: input,
      }
    },
  })
}
