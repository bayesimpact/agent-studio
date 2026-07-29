import { DocumentsRagMode, ToolName } from "@caseai-connect/api-contracts"
import { Inject, Injectable, Logger } from "@nestjs/common"
import type { ToolSet } from "ai"
import type { LLMProvider } from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSessionsService } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service"
import { AgentSettingsService } from "@/domains/agents/settings/agent-settings.service"
import { AgentSubAgentsService } from "@/domains/agents/sub-agents/agent-sub-agents.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentChunkRetrievalService } from "@/domains/documents/embeddings/document-chunk-retrieval.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpServersService } from "@/domains/mcp-servers/mcp-servers.service"
import { ProjectsService } from "@/domains/projects/projects.service"
import { ServiceWithLLM } from "@/external/llm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpClientService } from "@/external/mcp"
import { generateMasterPrompt } from "./master-promts/generate-master-prompt"
import type { AgentSessionScope, OnExecute } from "./streaming-session.types"
import { type BuiltTools, buildSubAgentTools } from "./sub-agent-tools"
import { fillFormTool } from "./tools/fill-form.tool"
import { lookupKnowledgeBaseTool } from "./tools/lookup-knowledge-base.tool"
import { createRetrievedChunksRegistry } from "./tools/retrieved-chunks-registry"
import {
  submitTurnSummaryInstruction,
  submitTurnSummaryTool,
} from "./tools/submit-turn-summary.tool"
import { surfaceResourcesTool } from "./tools/surface-resources.tool"

/**
 * Tools whose output the model never needs: they only log/notify (sources,
 * resource cards, session metadata). When a tool-loop step invokes only these,
 * the loop stops instead of paying an extra LLM generation for an empty
 * follow-up. Round-trip tools (lookup_knowledge_base, fillForm, MCP,
 * sub-agents) stay out of this list because the model consumes their output.
 */
const FIRE_AND_FORGET_TOOL_NAMES: string[] = [ToolName.SurfaceResources, ToolName.SubmitTurnSummary]

/**
 * The tools exposed by an agent's enabled MCP servers
 */
type McpToolset = {
  // A function that tears down every open MCP session. If no MCP sessions were opened, this will be undefined.
  disconnect: (() => Promise<void>) | undefined
  // The tools exposed by the agent's enabled MCP servers.
  tools: ToolSet
  // Descriptions for the tools exposed by the agent's enabled MCP servers.
  toolDescriptions: Record<string, string>
}

/**
 * Builds the tool sets exposed to the LLM for a given agent.
 *
 * Owns everything related to tools: MCP tool wiring, conversation agent
 * tools, sub-agent tools, and the helpers that merge and filter them. Extracted
 * from StreamingService so that service can focus on the streaming lifecycle.
 */
@Injectable()
export class ToolsService extends ServiceWithLLM {
  private readonly logger = new Logger(ToolsService.name)

  constructor(
    @Inject(ConversationAgentSessionsService)
    private readonly conversationAgentSessionsService: ConversationAgentSessionsService,
    @Inject(AgentSubAgentsService)
    private readonly agentSubAgentsService: AgentSubAgentsService,
    @Inject(AgentSettingsService)
    private readonly agentSettingsService: AgentSettingsService,
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,

    private readonly documentChunkRetrievalService: DocumentChunkRetrievalService,
    private readonly mcpClientService: McpClientService,
    private readonly mcpServersService: McpServersService,

    @Inject("_MockLLMProvider")
    mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    vertexLlmProvider: LLMProvider,
    @Inject("Vertex3LLMProvider")
    vertex3LlmProvider: LLMProvider,
    @Inject("MistralLLMProvider")
    mistralLlmProvider: LLMProvider,
    @Inject("MedGemmaLLMProvider")
    medGemmaLlmProvider: LLMProvider,
    @Inject("GemmaLLMProvider")
    gemmaLlmProvider: LLMProvider,
  ) {
    super({
      mockLlmProvider,
      vertexLlmProvider,
      vertex3LlmProvider,
      medGemmaLlmProvider,
      gemmaLlmProvider,
      mistralLlmProvider,
    })
  }

  async buildTools({
    agentSessionScope,
    onExecute,
    includeSessionMetadataTools = true,
    includeSubAgentTools = true,
  }: {
    agentSessionScope: AgentSessionScope
    onExecute: OnExecute
    includeSessionMetadataTools?: boolean
    includeSubAgentTools?: boolean
  }): Promise<BuiltTools> {
    const { agent } = agentSessionScope
    const mcp = await this.buildMcpTools({ agent, onExecute })

    switch (agent.type) {
      case "conversation":
        return this.buildConversationAgentTools({
          agentSessionScope,
          includeSessionMetadataTools,
          includeSubAgentTools,
          mcp,
          onExecute,
        })

      default:
        return {
          mcpClose: mcp.disconnect,
          toolDescriptions: {},
          tools: undefined,
          fireAndForgetToolNames: [],
          endOfTurnTools: {},
          toolActivationPrerequisites: {},
          hasSubAgentTools: false,
        }
    }
  }

  private async buildMcpTools({
    agent,
    onExecute,
  }: {
    agent: Agent
    onExecute: OnExecute
  }): Promise<McpToolset> {
    const mcpCloseFns: (() => Promise<void>)[] = []
    const mcpTools: ToolSet = {}
    const mcpToolDescriptions: Record<string, string> = {}

    const serverConfigs = await this.mcpServersService.getEnabledServersForAgent(agent.id)
    for (const serverConfig of serverConfigs) {
      const mcpSession = await this.mcpClientService.connect(serverConfig)
      mcpCloseFns.push(mcpSession.close)
      for (const [toolName, toolDef] of Object.entries(mcpSession.tools)) {
        const originalExecute = toolDef.execute
        if (!originalExecute) continue
        const description = this.getToolDescription(toolDef)
        if (description) mcpToolDescriptions[toolName] = description
        mcpTools[toolName] = {
          ...toolDef,
          execute: (async (...executeArgs: Parameters<typeof originalExecute>) => {
            this.logger.log(
              `[MCP] Calling tool "${toolName}" with args: ${JSON.stringify(executeArgs[0])}`,
            )
            await onExecute({
              toolName,
              arguments: (executeArgs[0] ?? {}) as Record<string, unknown>,
            })
            try {
              const result = await originalExecute(...executeArgs)
              this.logger.log(`[MCP] Tool "${toolName}" returned: ${JSON.stringify(result)}`)
              return result
            } catch (error) {
              this.logger.error(`[MCP] Tool "${toolName}" failed: ${error}`)
              throw error
            }
          }) as typeof originalExecute,
        }
      }
    }

    const disconnect =
      mcpCloseFns.length > 0
        ? async () => {
            for (const closeFn of mcpCloseFns) await closeFn()
          }
        : undefined

    return { disconnect, tools: mcpTools, toolDescriptions: mcpToolDescriptions }
  }

  private async buildConversationAgentTools({
    agentSessionScope,
    includeSessionMetadataTools,
    includeSubAgentTools,
    mcp,
    onExecute,
  }: {
    agentSessionScope: AgentSessionScope
    includeSessionMetadataTools: boolean
    includeSubAgentTools: boolean
    mcp: McpToolset
    onExecute: OnExecute
  }): Promise<BuiltTools> {
    const { agent, agentSettings, connectScope, session } = agentSessionScope
    // fillForm needs a persisted session carrying a `result` column — public
    // streaming sessions (proxy, no DB row) can't accumulate form state.
    const hasFillFormTool =
      agentSettings.fillFormEnabled && agentSettings.outputJsonSchema != null && "result" in session
    const [hasSourcesTool, { tools: subAgentTools, toolDescriptions: subAgentToolDescriptions }] =
      await Promise.all([
        // Check if the agent has the sources tool enabled
        this.projectsService.hasFeature({ connectScope, feature: "sources-tool" }),

        // Build sub-agent tools if requested
        includeSubAgentTools
          ? buildSubAgentTools({
              agentSessionScope,
              agentSubAgentsService: this.agentSubAgentsService,
              buildLLMConfig: (params) => this.buildLLMConfig(params),
              buildTools: (params) => this.buildTools(params),
              conversationAgentSessionsService: this.conversationAgentSessionsService,
              agentSettingsService: this.agentSettingsService,
              generateMasterPrompt,
              getProviderForModel: (model) => this.getProviderForModel(model),
              onExecute,
              projectsService: this.projectsService,
            })
          : Promise.resolve({ tools: {}, toolDescriptions: {} }),
      ])

    const hasSessionCategorization =
      includeSessionMetadataTools && (agent.sessionCategories?.length ?? 0) > 0
    // chunkIds only make sense when the agent can actually retrieve chunks:
    // the sources part of the turn summary requires BOTH the project feature
    // flag and an active RAG mode (lookup tool present).
    const hasSourcesReporting =
      hasSourcesTool && agentSettings.documentsRagMode !== DocumentsRagMode.None
    const hasSubmitTurnSummaryTool = hasSourcesReporting || hasSessionCategorization

    // Shared between lookup (writer) and submit_turn_summary (reader) within this
    // request: the report resolves the chunkIds cited by the model against
    // the chunks lookup actually retrieved.
    const retrievedChunksRegistry = createRetrievedChunksRegistry()

    // The end-of-turn report is declared in the answering loop (the model
    // can call it in the same generation as its answer — no extra call) AND
    // referenced in endOfTurnTools: the provider forces it after the answer
    // whenever the loop did not call it, so it runs on every turn no matter
    // what. Only the tool's fields stay dynamic (sources / categorization
    // per agent config).
    const endOfTurnTools: ToolSet = hasSubmitTurnSummaryTool
      ? {
          [ToolName.SubmitTurnSummary]: submitTurnSummaryTool({
            retrievedChunksRegistry: hasSourcesReporting ? retrievedChunksRegistry : undefined,
            sessionMetadata: hasSessionCategorization
              ? {
                  connectScope,
                  sessionId: session.id,
                  availableCategoryNames: (agent.sessionCategories ?? [])
                    .map((agentSessionCategory) => agentSessionCategory.name)
                    .sort((leftCategoryName, rightCategoryName) =>
                      leftCategoryName.localeCompare(rightCategoryName),
                    ),
                  conversationAgentSessionsService: this.conversationAgentSessionsService,
                }
              : undefined,
            onExecute,
          }),
        }
      : {}

    const tools: ToolSet = {
      // The end-of-turn report is callable from turn 1, like any other tool.
      ...endOfTurnTools,

      // Add the document retrieval tool if the agent has a RAG mode enabled
      ...(agentSettings.documentsRagMode === DocumentsRagMode.None
        ? {}
        : {
            [ToolName.LookupKnowledgeBase]: lookupKnowledgeBaseTool({
              connectScope,
              documentTagIds:
                agentSettings.documentsRagMode === DocumentsRagMode.Tags
                  ? (agent.documentTags?.map((documentTag) => documentTag.id) ?? [])
                  : [],
              retrievalService: this.documentChunkRetrievalService,
              retrievedChunksRegistry,
              onExecute,
            }),
          }),

      // Add the surface resources tool if the agent has any resource libraries
      ...((agent.resourceLibraries?.length ?? 0) > 0
        ? { [ToolName.SurfaceResources]: surfaceResourcesTool({ onExecute }) }
        : {}),

      // Add the fillForm tool if the agent has it enabled (with a form definition)
      ...(hasFillFormTool
        ? {
            [ToolName.FillForm]: fillFormTool({
              agentSessionScope,
              sessionResultUpdater: this.conversationAgentSessionsService,
              onExecute,
            }),
          }
        : {}),
    }

    // Merge the MCP tools into the final tool set
    this.addToolsWithoutCollisions({ target: tools, source: mcp.tools, sourceLabel: "MCP" })

    // Merge the sub-agent tools into the final tool set
    this.addToolsWithoutCollisions({
      target: tools,
      source: subAgentTools,
      sourceLabel: "sub-agent",
    })

    return {
      mcpClose: mcp.disconnect,
      tools,
      toolDescriptions: {
        ...this.filterToolDescriptions({
          descriptions: { ...mcp.toolDescriptions, ...subAgentToolDescriptions },
          tools,
        }),
        // Master-prompt note about the automatic end-of-turn report,
        // assembled from the same switches as its schema.
        ...(hasSubmitTurnSummaryTool
          ? {
              [ToolName.SubmitTurnSummary]: submitTurnSummaryInstruction({
                includeSources: hasSourcesTool,
                includeSessionMetadata: hasSessionCategorization,
              }),
            }
          : {}),
      },
      fireAndForgetToolNames: FIRE_AND_FORGET_TOOL_NAMES.filter((toolName) => toolName in tools),
      endOfTurnTools,
      // The turn summary carries a chunkIds field only for RAG agents — and
      // even then it is only DECLARED to the model once the knowledge base
      // was actually queried in the turn.
      toolActivationPrerequisites: hasSourcesReporting
        ? { [ToolName.SubmitTurnSummary]: ToolName.LookupKnowledgeBase }
        : {},
      hasSubAgentTools: Object.keys(subAgentTools).length > 0,
    }
  }

  private addToolsWithoutCollisions({
    source,
    sourceLabel,
    target,
  }: {
    source: ToolSet
    sourceLabel: string
    target: ToolSet
  }) {
    for (const [toolName, toolDef] of Object.entries(source)) {
      if (target[toolName]) {
        this.logger.warn(
          `Skipping ${sourceLabel} tool "${toolName}" because another tool with the same name is already registered.`,
        )
        continue
      }
      target[toolName] = toolDef
    }
  }

  private filterToolDescriptions({
    descriptions,
    tools,
  }: {
    descriptions: Record<string, string>
    tools: ToolSet | undefined
  }): Record<string, string> {
    if (!tools) return {}

    return Object.fromEntries(
      Object.keys(tools)
        .map((toolName) => [toolName, descriptions[toolName]] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    )
  }

  private getToolDescription(toolDef: unknown): string | undefined {
    if (!toolDef || typeof toolDef !== "object" || !("description" in toolDef)) {
      return undefined
    }

    const description = (toolDef as { description?: unknown }).description
    return typeof description === "string" && description.trim().length > 0
      ? description
      : undefined
  }
}
