import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Project } from "@/domains/projects/project.entity"
import type { McpServer } from "./mcp-server.entity"

type McpServerTransientParams = Record<string, never>

class McpServerFactory extends Factory<McpServer, McpServerTransientParams> {
  preset(slug: string) {
    return this.params({ presetSlug: slug, projectId: null })
  }
}

export const mcpServerFactory = McpServerFactory.define(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test MCP Server ${sequence}`,
    presetSlug: params.presetSlug ?? null,
    projectId: params.projectId ?? null,
    project: (params.project as Project) ?? null,
    encryptedConfig: params.encryptedConfig || "test-encrypted-config",
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: params.deletedAt || null,
    agentMcpServers: params.agentMcpServers || [],
  } satisfies McpServer
})
