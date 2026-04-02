import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import { Injectable, Logger } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import type { ToolSet } from "ai"

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name)
  private readonly serverUrl: string | undefined
  private readonly apiKey: string | undefined

  constructor(private readonly configService: ConfigService) {
    this.serverUrl = this.configService.get<string>("MCP_SOCIAL_SERVER_URL")
    this.apiKey = this.configService.get<string>("MCP_SOCIAL_API_KEY")
  }

  async getTools(): Promise<ToolSet> {
    if (!this.serverUrl || !this.apiKey) {
      this.logger.warn(
        "MCP social server not configured (missing MCP_SOCIAL_SERVER_URL or MCP_SOCIAL_API_KEY)",
      )
      return {}
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

      return (await client.tools()) as ToolSet
    } catch (error) {
      this.logger.error("Failed to get tools from MCP social server", error)
      return {}
    } finally {
      await client?.close()
    }
  }
}
