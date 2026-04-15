import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Agent } from "@/domains/agents/agent.entity"
import type { AgentMcpServer } from "./agent-mcp-server.entity"
import type { McpServer } from "./mcp-server.entity"

type AgentMcpServerTransientParams = {
  agent: Agent
  mcpServer: McpServer
}

class AgentMcpServerFactory extends Factory<AgentMcpServer, AgentMcpServerTransientParams> {}

export const agentMcpServerFactory = AgentMcpServerFactory.define(({ params, transientParams }) => {
  if (!transientParams.agent) {
    throw new Error("agent transient is required")
  }
  if (!transientParams.mcpServer) {
    throw new Error("mcpServer transient is required")
  }

  const now = new Date()
  return {
    id: params.id || randomUUID(),
    agentId: transientParams.agent.id,
    mcpServerId: transientParams.mcpServer.id,
    enabled: params.enabled ?? true,
    agent: transientParams.agent,
    mcpServer: transientParams.mcpServer,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: params.deletedAt || null,
  } satisfies AgentMcpServer
})
