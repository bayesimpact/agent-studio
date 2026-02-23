import { z } from "zod"

export const schema = z.object({
  id: z.string(),
  input: z.string(),
  expectedOutput: z.string(),
  output: z.string(),
  status: z.string(),
  score: z.string(),
})
