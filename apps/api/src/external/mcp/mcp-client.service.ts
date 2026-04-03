import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import { Injectable, Logger } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import type { ToolSet } from "ai"

export type McpSession = {
  tools: ToolSet
  close: () => Promise<void>
}

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name)
  private readonly serverUrl: string | undefined
  private readonly apiKey: string | undefined

  constructor(private readonly configService: ConfigService) {
    this.serverUrl = this.configService.get<string>("MCP_SOCIAL_SERVER_URL")
    this.apiKey = this.configService.get<string>("MCP_SOCIAL_API_KEY")
  }

  async connect(): Promise<McpSession> {
    if (!this.serverUrl || !this.apiKey) {
      this.logger.warn(
        "MCP social server not configured (missing MCP_SOCIAL_SERVER_URL or MCP_SOCIAL_API_KEY)",
      )
      return { tools: {}, close: async () => {} }
    }

    let client: MCPClient | undefined
    try {
      client = await createMCPClient({
        transport: {
          type: "http",
          url: this.serverUrl,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
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
        `Failed to connect to MCP social server: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      )
      await client?.close()
      return { tools: {}, close: async () => {} }
    }
  }
}