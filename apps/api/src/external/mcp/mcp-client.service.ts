import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import { Injectable, Logger } from "@nestjs/common"
import type { ToolSet } from "ai"

export type McpSession = {
  tools: ToolSet
  close: () => Promise<void>
}

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name)

  async connect(config: { url: string; apiKey?: string }): Promise<McpSession> {
    let client: MCPClient | undefined
    try {
      client = await createMCPClient({
        transport: {
          type: "http",
          url: config.url,
          ...(config.apiKey
            ? {
                headers: {
                  Authorization: `Bearer ${config.apiKey}`,
                },
              }
            : {}),
        },
        name: "caseai-connect",
        version: "1.0.0",
      })

      const tools = (await client.tools()) as ToolSet
      return {
        tools,
        close: () => client?.close() ?? Promise.resolve(),
      }
    } catch (error) {
      this.logger.error(
        `Failed to connect to MCP server at ${config.url}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      )
      await client?.close()
      return { tools: {}, close: async () => {} }
    }
  }
}
