import { createInterface } from "node:readline"
import { NestFactory } from "@nestjs/core"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AppModule } from "@/app.module"
import { Agent } from "@/domains/agents/agent.entity"
import { McpServer } from "@/domains/mcp-servers/mcp-server.entity"
import { McpServersService } from "@/domains/mcp-servers/mcp-servers.service"
import { Project } from "@/domains/projects/project.entity"

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
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  })

  try {
    const mcpServerRepository = app.get<Repository<McpServer>>(getRepositoryToken(McpServer))
    const projectRepository = app.get<Repository<Project>>(getRepositoryToken(Project))
    const agentRepository = app.get<Repository<Agent>>(getRepositoryToken(Agent))
    const mcpServersService = app.get(McpServersService)

    const allServers = await mcpServerRepository.find({ order: { name: "ASC" } })
    const presetServers = allServers.filter((server) => server.presetSlug !== null)

    if (presetServers.length === 0) {
      console.log("No MCP server presets found. Run `npm run seed:mcp-preset` first.")
      return
    }

    console.log("\nAvailable MCP server presets:")
    for (const server of presetServers) {
      console.log(`  [${server.presetSlug}] ${server.name} (${server.id})`)
    }

    const slug = await ask("\nPreset slug to link: ")
    const selected = presetServers.find((server) => server.presetSlug === slug)
    if (!selected) {
      console.error(`No preset found with slug "${slug}"`)
      process.exit(1)
    }

    const projectId = await ask("Project ID: ")
    const project = await projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      console.error(`No project found with ID "${projectId}"`)
      process.exit(1)
    }

    // List agents in this project
    const agents = await agentRepository.find({
      where: { projectId: project.id },
      order: { name: "ASC" },
    })

    if (agents.length === 0) {
      console.log(`\nNo agents found in project "${project.name}".`)
      return
    }

    console.log(`\nAgents in project "${project.name}":`)
    for (const agent of agents) {
      console.log(`  [${agent.id}] ${agent.name} (${agent.type})`)
    }

    const agentInput = await ask("\nAgent ID to link (or 'all' for all agents): ")

    const agentsToLink =
      agentInput === "all" ? agents : agents.filter((agent) => agent.id === agentInput)

    if (agentsToLink.length === 0) {
      console.error(`No agent found with ID "${agentInput}"`)
      process.exit(1)
    }

    for (const agent of agentsToLink) {
      await mcpServersService.enableForAgent(agent.id, selected.id)
      console.log(`  Linked "${selected.name}" → agent "${agent.name}" (${agent.id})`)
    }

    console.log("\nDone.")
  } finally {
    await app.close()
  }
}

void main()
