import { z } from "zod"
import { agentSchema } from "@/features/agents/agents.models"

export const schema = z.object({
  id: z.string(),
  createdAt: z.number(),
  agent: agentSchema,
  status: z.enum(["loading", "done"]),
  output: z.string(),
  score: z.string(),
  traceUrl: z.string(),
})
