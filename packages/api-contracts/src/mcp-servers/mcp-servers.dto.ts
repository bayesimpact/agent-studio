import { z } from "zod"
import type { TimeType } from "../generic"

export type McpServerDto = {
  id: string
  name: string
  url: string
  projectId: string
  authStatus: McpServerAuthStatus
  createdAt: TimeType
  updatedAt: TimeType
}

export const createMcpServerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.string().url(),
  apiKey: z.string().optional(),
  /**
   * Static headers sent on every call to this server, for whatever it expects
   * beyond its auth (an API version, a tenant).
   */
  headers: z.record(z.string().trim().min(1), z.string()).optional(),
})

export type CreateMcpServerDto = z.infer<typeof createMcpServerSchema>

export type McpServerAuthStatus = "none" | "apiKey" | "oauthPending" | "oauthConnected"

export type McpServerOauthInitiationDto = {
  authorizationUrl: string
}

export const completeMcpServerOauthSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

export type CompleteMcpServerOauthDto = z.infer<typeof completeMcpServerOauthSchema>
