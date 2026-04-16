import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "@/app.module"
import { McpServersService } from "@/domains/mcp-servers/mcp-servers.service"
import { ask, confirmDatabaseTarget } from "@/scripts/script-bootstrap"

const logger = new Logger("SeedMcpPreset")

async function confirmEncryptionKey(): Promise<void> {
  const currentKey = process.env.MCP_ENCRYPTION_KEY
  if (currentKey) {
    const masked = `*****${currentKey.slice(-6)}`
    logger.warn(`MCP_ENCRYPTION_KEY: ${masked}`)
    const answer = await ask("Use this key? (yes/no): ")
    if (answer.toLowerCase() === "yes") {
      return
    }
  } else {
    logger.warn("MCP_ENCRYPTION_KEY is not set")
  }
  const newKey = await ask("Enter MCP_ENCRYPTION_KEY: ")
  if (!newKey) {
    logger.error("MCP_ENCRYPTION_KEY is required")
    process.exit(1)
  }
  process.env.MCP_ENCRYPTION_KEY = newKey
}

async function main(): Promise<void> {
  await confirmDatabaseTarget(logger)
  await confirmEncryptionKey()

  const slug = await ask("Preset slug (e.g. social): ")
  const name = await ask("Display name (e.g. Bayes Social): ")
  const url = await ask("MCP server URL: ")
  const apiKey = await ask("API key (leave empty if none): ")

  if (!slug || !name || !url) {
    logger.error("slug, name and url are required")
    process.exit(1)
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const mcpServersService = app.get(McpServersService)
    const server = await mcpServersService.createPreset(slug, name, {
      url,
      ...(apiKey ? { apiKey } : {}),
    })

    logger.log(`MCP server created:`)
    logger.log(`  ID:   ${server.id}`)
    logger.log(`  Slug: ${server.presetSlug}`)
    logger.log(`  Name: ${server.name}`)
    logger.log(`To enable for an agent:`)
    logger.log(
      `  INSERT INTO agent_mcp_server (id, agent_id, mcp_server_id, enabled, created_at, updated_at)`,
    )
    logger.log(`  VALUES (gen_random_uuid(), '<agent_id>', '${server.id}', true, now(), now());`)
  } finally {
    await app.close()
  }
}

void main()
