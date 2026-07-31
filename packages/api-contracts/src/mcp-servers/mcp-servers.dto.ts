import { z } from "zod"
import type { TimeType } from "../generic"

export type McpServerDto = {
  id: string
  name: string
  url: string
  projectId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export const createMcpServerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.string().url(),
  apiKey: z.string().optional(),
  /**
   * Static headers sent on every call to this server, e.g. tagging which
   * deployment calls it when one server serves several agents.
   */
  headers: z.record(z.string().trim().min(1), z.string()).optional(),
})

export type CreateMcpServerDto = z.infer<typeof createMcpServerSchema>
