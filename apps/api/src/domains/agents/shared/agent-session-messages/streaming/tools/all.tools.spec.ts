import {
  DocumentsRagMode,
  type StreamEvent,
  type StreamEventPayload,
  ToolName,
} from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import { tool } from "ai"
import { v4 } from "uuid"
import { z } from "zod"
import type { AllRepositories } from "@/common/test/test-all-repositories"
import {
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { StreamingModule } from "@/domains/agents/shared/agent-session-messages/streaming/streaming.module"
import { StreamingService } from "@/domains/agents/shared/agent-session-messages/streaming/streaming.service"
import type { AgentSessionScope } from "@/domains/agents/shared/agent-session-messages/streaming/streaming-session.types"
import { ToolsService } from "@/domains/agents/shared/agent-session-messages/streaming/tools.service"
import { DocumentChunkRetrievalService } from "@/domains/documents/embeddings/document-chunk-retrieval.service"
import { McpServersService } from "@/domains/mcp-servers/mcp-servers.service"
import {
  addFeature,
  createOrganizationWithAgent,
} from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import type { AISDKMockProvider } from "@/external/llm/providers/ai-sdk-mock.provider"
import { McpClientService } from "@/external/mcp"
import { DEFAULT_TOP_K } from "./lookup-knowledge-base.tool"

const mockDocumentChunkRetrievalService = { retrieveTopChunks: jest.fn() }
const mockMcpServersService = { getEnabledServersForAgent: jest.fn() }
const mockMcpClientService = { connect: jest.fn() }

describe("Tools execution", () => {
  let service: StreamingService
  let mockProvider: AISDKMockProvider
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [StreamingModule],
      applyOverrides: (moduleBuilder) =>
        moduleBuilder
          .overrideProvider(DocumentChunkRetrievalService)
          .useValue(mockDocumentChunkRetrievalService)
          .overrideProvider(McpServersService)
          .useValue(mockMcpServersService)
          .overrideProvider(McpClientService)
          .useValue(mockMcpClientService),
    })
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await sdk.shutdown()
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    service = setup.module.get<StreamingService>(StreamingService)
    mockProvider = setup.module.get<AISDKMockProvider>("_MockLLMProvider")
    mockProvider.resetMock()
    repositories = setup.getAllRepositories()

    jest.clearAllMocks()
    mockDocumentChunkRetrievalService.retrieveTopChunks.mockResolvedValue([])
    mockMcpServersService.getEnabledServersForAgent.mockResolvedValue([])
  })

  const createContextWithSession = async () => {
    const { organization, project, agent, agentSettings, conversationAgentSession } =
      await createOrganizationWithAgent(repositories, {
        agent: { type: "conversation" },
        withLiveConversationAgentSession: true,
      })

    return {
      connectScope: { organizationId: organization.id, projectId: project.id },
      organization,
      project,
      agent,
      agentSettings,
      session: conversationAgentSession as ConversationAgentSession,
    }
  }
  const aggregateStream = async (
    generator: AsyncGenerator<StreamEvent, void, unknown>,
  ): Promise<{ fulltextStream: string; events: StreamEventPayload[] }> => {
    const events: StreamEventPayload[] = []
    let fulltextStream: string = ""
    for await (const event of generator) {
      const eventData = JSON.parse(event.data) as StreamEventPayload
      events.push(eventData)
      if (eventData.type === "chunk") {
        fulltextStream += eventData.content
      }
    }
    return { events, fulltextStream }
  }
  const runWithToolCall = async ({
    agent,
    agentSettings,
    session,
    connectScope,
    toolName,
    toolInput,
  }: {
    agent: AgentSessionScope["agent"]
    agentSettings: AgentSessionScope["agentSettings"]
    session: AgentSessionScope["session"]
    connectScope: AgentSessionScope["connectScope"]
    toolName: string
    toolInput: unknown
  }) => {
    mockProvider.addToolCallTurn(agent.id, toolName, toolInput)
    mockProvider.addTextTurn(agent.id, "Done.")

    const { fulltextStream } = await aggregateStream(
      service.streamAgentResponse({
        agentSessionScope: { agent, agentSettings, session, connectScope },
        userContent: "Bonjour",
        notifyClient: () => undefined,
      }),
    )
    const agentCalls = mockProvider.getCalls().filter((call) => call.agentId === agent.id)
    return { fulltextStream, agentCalls }
  }

  const retrievedChunk = {
    chunkId: "chunk-1",
    documentId: "document-1",
    documentTitle: "Onboarding Guide",
    documentFileName: "guide.pdf",
    documentSourceType: "project",
    chunkIndex: 0,
    content: "Onboarding lasts two weeks.",
    distance: 0.1,
    modelName: "gemini-embedding-001",
    isParentChunk: false,
  }

  /**
   * Runs a sourced answer in one of the two shapes real models produce:
   *
   * - `citeWithAnswer`: one step that answers AND cites (Gemini-class models).
   *   The turn must end there instead of spending a step on the tool result.
   * - `citeThenAnswer`: a citation step of its own, then the answer (models that
   *   cannot mix text and tool calls in a step, e.g. Gemma through vLLM). The
   *   loop must keep going, or the user never gets an answer.
   */
  const runSourcedAnswer = async ({
    agent,
    agentSettings,
    session,
    connectScope,
    refs,
    shape = "citeWithAnswer",
  }: {
    agent: AgentSessionScope["agent"]
    agentSettings: AgentSessionScope["agentSettings"]
    session: AgentSessionScope["session"]
    connectScope: AgentSessionScope["connectScope"]
    refs: number[]
    shape?: "citeWithAnswer" | "citeThenAnswer"
  }) => {
    mockProvider.addToolCallTurn(agent.id, ToolName.LookupKnowledgeBase, {
      query: "How long does onboarding take?",
    })
    if (shape === "citeWithAnswer") {
      mockProvider.addTextWithToolCallTurn(
        agent.id,
        "Onboarding lasts two weeks.",
        ToolName.Sources,
        { refs },
      )
      // Would be consumed by a third LLM turn, which must not happen.
      mockProvider.addTextTurn(agent.id, "Should never be streamed.")
    } else {
      mockProvider.addToolCallTurn(agent.id, ToolName.Sources, { refs })
      mockProvider.addTextTurn(agent.id, "Onboarding lasts two weeks.")
    }

    const { fulltextStream } = await aggregateStream(
      service.streamAgentResponse({
        agentSessionScope: { agent, agentSettings, session, connectScope },
        userContent: "How long does onboarding take?",
        notifyClient: () => undefined,
      }),
    )
    const agentCalls = mockProvider.getCalls().filter((call) => call.agentId === agent.id)
    // The sources panel reads the assistant message's tool calls.
    const sourcesToolCalls = (
      await repositories.agentMessageRepository.find({
        where: { sessionId: session.id, role: "assistant" },
      })
    ).flatMap((message) =>
      (message.toolCalls ?? []).filter((call) => call.name === ToolName.Sources),
    )

    return { agentCalls, fulltextStream, sourcesToolCalls }
  }

  const createSourcesContextWithSession = async () => {
    const context = await createContextWithSession()
    await addFeature({
      featureFlagRepository: repositories.featureFlagRepository,
      projectId: context.project.id,
      featureFlagKey: "sources-tool",
    })
    mockDocumentChunkRetrievalService.retrieveTopChunks.mockResolvedValue([retrievedChunk])
    return {
      ...context,
      agentSettings: { ...context.agentSettings, documentsRagMode: DocumentsRagMode.All },
    }
  }

  it("ToolName.Sources - resolves cited refs to the real retrieved passages", async () => {
    const { connectScope, agent, agentSettings, session } = await createSourcesContextWithSession()

    const { sourcesToolCalls } = await runSourcedAnswer({
      agent,
      agentSettings,
      session,
      connectScope,
      refs: [1],
    })

    // The model only passed a ref: ids, title, source type and quote come from
    // the retrieval itself.
    expect(sourcesToolCalls[0]?.arguments).toEqual({
      sources: [
        {
          documentId: "document-1",
          documentTitle: "Onboarding Guide",
          documentSourceType: "project",
          chunks: [{ chunkId: "chunk-1", partialContent: "Onboarding lasts two weeks." }],
        },
      ],
    })
  })

  it("ToolName.Sources - ends the turn instead of asking the LLM once more", async () => {
    const { connectScope, agent, agentSettings, session } = await createSourcesContextWithSession()

    const { agentCalls, fulltextStream } = await runSourcedAnswer({
      agent,
      agentSettings,
      session,
      connectScope,
      refs: [1],
    })

    // One call to look the knowledge base up, one to answer and cite — no third.
    expect(agentCalls).toHaveLength(2)
    expect(fulltextStream).toBe("Onboarding lasts two weeks.")
  })

  it("ToolName.Sources - still answers when the model cites before answering", async () => {
    const { connectScope, agent, agentSettings, session } = await createSourcesContextWithSession()

    const { agentCalls, fulltextStream, sourcesToolCalls } = await runSourcedAnswer({
      agent,
      agentSettings,
      session,
      connectScope,
      refs: [1],
      shape: "citeThenAnswer",
    })

    expect(agentCalls).toHaveLength(3)
    expect(fulltextStream).toBe("Onboarding lasts two weeks.")
    expect(sourcesToolCalls).toHaveLength(1)
  })

  it("ToolName.Sources - shows no source when the model cites an unknown ref", async () => {
    const { connectScope, agent, agentSettings, session } = await createSourcesContextWithSession()

    const { sourcesToolCalls } = await runSourcedAnswer({
      agent,
      agentSettings,
      session,
      connectScope,
      refs: [99],
    })

    expect(sourcesToolCalls).toEqual([])
  })

  it("ToolName.Sources - is not built without knowledge base retrieval", async () => {
    const { connectScope, agent, agentSettings, session } = await createSourcesContextWithSession()
    const toolsService = setup.module.get<ToolsService>(ToolsService)

    const { tools } = await toolsService.buildTools({
      agentSessionScope: {
        agent,
        agentSettings: { ...agentSettings, documentsRagMode: DocumentsRagMode.None },
        session,
        connectScope,
      },
      onExecute: () => undefined,
    })

    expect(tools?.[ToolName.Sources]).toBeUndefined()
  })

  it("ToolName.SurfaceResources - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createContextWithSession()

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.SurfaceResources,
      toolInput: {
        resources: [
          { id: "resource-1", title: "Guide", description: "A guide", link: "https://x.test" },
        ],
      },
    })

    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("Resources received and shown")
  })

  it("ToolName.RecalculateConversationSessionMetadata - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createContextWithSession()

    const category = await repositories.agentSessionCategoryRepository.save(
      repositories.agentSessionCategoryRepository.create({ agentId: agent.id, name: "Bayes" }),
    )
    agent.sessionCategories = [category]

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.RecalculateConversationSessionMetadata,
      toolInput: {
        currentCategoryNames: [],
        suggestedTitle: "About Bayes",
        categoryNames: ["Bayes"],
      },
    })

    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("Bayes")

    const updatedSession = await repositories.conversationAgentSessionRepository.findOneByOrFail({
      id: session.id,
    })
    expect(updatedSession.title).toBe("About Bayes")
  })

  const fillFormOutputJsonSchema = {
    type: "object",
    properties: { fullName: { type: "string" }, city: { type: "string" } },
  }

  const createFillFormContextWithSession = async (
    result: Record<string, unknown> | null = null,
  ) => {
    const { user, organization, project, agent, agentSettings } = await createOrganizationWithAgent(
      repositories,
      {
        agent: { type: "conversation" },
        agentSettings: { fillFormEnabled: true, outputJsonSchema: fillFormOutputJsonSchema },
      },
    )
    const session = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .live()
      .build({ result })
    await repositories.conversationAgentSessionRepository.save(session)
    return {
      connectScope: { organizationId: organization.id, projectId: project.id },
      agent,
      agentSettings,
      session,
    }
  }

  it("ToolName.FillForm - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createFillFormContextWithSession()

    await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.FillForm,
      toolInput: { formFields: { fullName: "John" } },
    })

    const updatedSession = await repositories.conversationAgentSessionRepository.findOneByOrFail({
      id: session.id,
    })
    expect(updatedSession.result).toEqual({ fullName: "John" })
  })

  it("ToolName.FillForm - should merge new fields into the existing session result", async () => {
    const { connectScope, agent, agentSettings, session } = await createFillFormContextWithSession({
      fullName: "Lara Croft",
    })

    await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.FillForm,
      toolInput: { formFields: { city: "Lyon" } },
    })

    const updatedSession = await repositories.conversationAgentSessionRepository.findOneByOrFail({
      id: session.id,
    })
    expect(updatedSession.result).toEqual({ fullName: "Lara Croft", city: "Lyon" })
  })

  it("ToolName.FillForm - should works - getFormState", async () => {
    const { connectScope, agent, agentSettings, session } = await createFillFormContextWithSession({
      fullName: "Lara Croft",
    })

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.FillForm,
      toolInput: { getFormState: true },
    })
    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("Lara Croft")
  })

  it("ToolName.FillForm - should not be built when fillFormEnabled is off", async () => {
    const { organization, project, agent, agentSettings, conversationAgentSession } =
      await createOrganizationWithAgent(repositories, {
        agent: { type: "conversation" },
        agentSettings: { fillFormEnabled: false, outputJsonSchema: fillFormOutputJsonSchema },
        withLiveConversationAgentSession: true,
      })
    const toolsService = setup.module.get<ToolsService>(ToolsService)

    const { tools } = await toolsService.buildTools({
      agentSessionScope: {
        agent,
        agentSettings,
        session: conversationAgentSession as ConversationAgentSession,
        connectScope: { organizationId: organization.id, projectId: project.id },
      },
      onExecute: () => undefined,
    })

    // Other conversation tools are still built; only fillForm is gated off.
    expect(tools?.[ToolName.LookupKnowledgeBase]).toBeDefined()
    expect(tools?.[ToolName.FillForm]).toBeUndefined()
  })

  it("ToolName.FillForm - should not be built for public proxy sessions", async () => {
    const { organization, project, agent, agentSettings } = await createOrganizationWithAgent(
      repositories,
      {
        agent: { type: "conversation" },
        agentSettings: { fillFormEnabled: true, outputJsonSchema: fillFormOutputJsonSchema },
      },
    )
    const toolsService = setup.module.get<ToolsService>(ToolsService)
    // Mirrors PublicStreamingSessionProxy: no persisted row, so no `result`
    // column to accumulate form state into.
    const publicSessionProxy = {
      id: v4(),
      traceId: v4(),
      organizationId: organization.id,
      messages: [],
    }

    const { tools } = await toolsService.buildTools({
      agentSessionScope: {
        agent,
        agentSettings,
        session: publicSessionProxy,
        connectScope: { organizationId: organization.id, projectId: project.id },
      },
      onExecute: () => undefined,
    })

    expect(tools?.[ToolName.LookupKnowledgeBase]).toBeDefined()
    expect(tools?.[ToolName.FillForm]).toBeUndefined()
  })

  it("ToolName.LookupKnowledgeBase - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createContextWithSession()
    const ragAgentSettings = { ...agentSettings, documentsRagMode: DocumentsRagMode.All }
    mockDocumentChunkRetrievalService.retrieveTopChunks.mockResolvedValue([])

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings: ragAgentSettings,
      session,
      connectScope,
      toolName: ToolName.LookupKnowledgeBase,
      toolInput: { query: "What is Bayes?" },
    })

    expect(mockDocumentChunkRetrievalService.retrieveTopChunks).toHaveBeenCalledWith(
      expect.objectContaining({ query: "What is Bayes?", topK: DEFAULT_TOP_K }),
    )
    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("passages")
  })

  it("ToolName.McpSearchResources - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createContextWithSession()
    const searchResourcesExecute = jest.fn().mockResolvedValue({ items: ["resource-1"] })
    mockMcpServersService.getEnabledServersForAgent.mockResolvedValue([{ url: "http://mcp.test" }])
    mockMcpClientService.connect.mockResolvedValue({
      tools: {
        [ToolName.McpSearchResources]: tool({
          description: "Search resources",
          inputSchema: z.object({ query: z.string() }),
          execute: searchResourcesExecute,
        }),
      },
      close: jest.fn(),
    })

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.McpSearchResources,
      toolInput: { query: "insurance" },
    })

    expect(searchResourcesExecute).toHaveBeenCalled()
    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("resource-1")
  })

  it("ToolName.McpSmartSearch - should works", async () => {
    const { connectScope, agent, agentSettings, session } = await createContextWithSession()
    const smartSearchExecute = jest.fn().mockResolvedValue({ answer: "smart answer" })
    mockMcpServersService.getEnabledServersForAgent.mockResolvedValue([{ url: "http://mcp.test" }])
    mockMcpClientService.connect.mockResolvedValue({
      tools: {
        [ToolName.McpSmartSearch]: tool({
          description: "Smart search",
          inputSchema: z.object({ query: z.string() }),
          execute: smartSearchExecute,
        }),
      },
      close: jest.fn(),
    })

    const { agentCalls } = await runWithToolCall({
      agent,
      agentSettings,
      session,
      connectScope,
      toolName: ToolName.McpSmartSearch,
      toolInput: { query: "how to file a claim" },
    })

    expect(smartSearchExecute).toHaveBeenCalled()
    expect(agentCalls).toHaveLength(2)
    expect(agentCalls[1]?.prompt).toContain("smart answer")
  })
})
