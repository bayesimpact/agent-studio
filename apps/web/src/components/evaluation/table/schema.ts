import { z } from "zod"

export const schema = z.object({
  id: z.string(),
  createdAt: z.number(),
  agent: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  status: z.enum(["idle", "loading", "done"]),
  output: z.string(),
  score: z.string(),
})
