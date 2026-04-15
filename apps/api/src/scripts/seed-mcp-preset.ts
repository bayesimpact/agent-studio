import { createInterface } from "node:readline"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "@/app.module"
import { McpServersService } from "@/domains/mcp-servers/mcp-servers.service"

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main(): Promise<void> {
  const slug = await ask("Preset slug (e.g. social): ")
  const name = await ask("Display name (e.g. Bayes Social): ")
  const url = await ask("MCP server URL: ")
  const apiKey = await ask("API key (leave empty if none): ")

  if (!slug || !name || !url) {
    console.error("slug, name and url are required")
    process.exit(1)
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  })

  try {
    const mcpServersService = app.get(McpServersService)
    const server = await mcpServersService.createPreset(slug, name, {
      url,
      ...(apiKey ? { apiKey } : {}),
    })

    console.log(`\nMCP server created:`)
    console.log(`  ID:   ${server.id}`)
    console.log(`  Slug: ${server.presetSlug}`)
    console.log(`  Name: ${server.name}`)
    console.log(`\nTo enable for an agent:`)
    console.log(
      `  INSERT INTO agent_mcp_server (id, agent_id, mcp_server_id, enabled, created_at, updated_at)`,
    )
    console.log(`  VALUES (gen_random_uuid(), '<agent_id>', '${server.id}', true, now(), now());`)
  } finally {
    await app.close()
  }
}

void main()
