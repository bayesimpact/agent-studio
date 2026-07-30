import { z } from "zod"
import type { RetrievedDocumentChunk } from "@/domains/documents/embeddings/document-chunk.types"
import { createRetrievedChunksRegistry } from "./retrieved-chunks-registry"
import {
  submitTurnSummaryDescription,
  submitTurnSummaryExecutionCounts,
  submitTurnSummaryInstruction,
  submitTurnSummaryTool,
} from "./submit-turn-summary.tool"

function buildChunk(overrides: Partial<RetrievedDocumentChunk>): RetrievedDocumentChunk {
  return {
    chunkId: "chunk-1",
    documentId: "document-1",
    documentTitle: "Onboarding Guide",
    documentFileName: "guide.pdf",
    documentSourceType: "project",
    chunkIndex: 0,
    content: "The onboarding process lasts two weeks.",
    distance: 0.1,
    modelName: "embedding-model",
    isParentChunk: false,
    ...overrides,
  }
}

function buildSessionMetadata(
  recalculate = jest.fn().mockResolvedValue({
    suggestedTitle: "Onboarding questions",
    selectedCategoryNames: ["HR"],
  }),
) {
  return {
    config: {
      connectScope: { organizationId: "organization-1", projectId: "project-1" },
      sessionId: "session-1",
      availableCategoryNames: ["HR", "IT"],
      conversationAgentSessionsService: {
        recalculateSessionMetadataFromMessages: recalculate,
      } as never,
    },
    recalculate,
  }
}

describe("submitTurnSummaryTool", () => {
  it("resolves cited chunkIds into full sources grouped by document", async () => {
    const onExecute = jest.fn()
    const registry = createRetrievedChunksRegistry()
    const firstAlias = registry.register(buildChunk({ chunkId: "chunk-1" }))
    const secondAlias = registry.register(
      buildChunk({
        chunkId: "chunk-2",
        documentId: "document-2",
        documentTitle: "Careers page",
        documentSourceType: "webCrawl",
        content: "We hire all year round.",
      }),
    )
    expect([firstAlias, secondAlias]).toEqual(["c1", "c2"])

    const sdkTool = submitTurnSummaryTool({ retrievedChunksRegistry: registry, onExecute })
    await sdkTool.execute?.({ chunkIds: [firstAlias, secondAlias] }, {} as never)

    expect(onExecute).toHaveBeenCalledWith({
      toolName: "sources",
      arguments: {
        sources: [
          {
            documentId: "document-1",
            documentTitle: "Onboarding Guide",
            documentSourceType: "project",
            chunks: [
              { chunkId: "chunk-1", partialContent: "The onboarding process lasts two weeks." },
            ],
          },
          {
            documentId: "document-2",
            documentTitle: "Careers page",
            documentSourceType: "webCrawl",
            chunks: [{ chunkId: "chunk-2", partialContent: "We hire all year round." }],
          },
        ],
      },
    })
  })

  it("dispatches session categorization and logs it under the legacy tool name", async () => {
    const onExecute = jest.fn()
    const { config, recalculate } = buildSessionMetadata()

    const sdkTool = submitTurnSummaryTool({ sessionMetadata: config, onExecute })
    await sdkTool.execute?.(
      { categoryNames: ["HR"], suggestedTitle: "Onboarding questions" },
      {} as never,
    )

    expect(recalculate).toHaveBeenCalledWith({
      connectScope: config.connectScope,
      sessionId: "session-1",
      selectedCategoryNames: ["HR"],
      suggestedTitle: "Onboarding questions",
    })
    expect(onExecute).toHaveBeenCalledWith({
      toolName: "recalculateConversationSessionMetadata",
      arguments: { suggestedTitle: "Onboarding questions", categoryNames: ["HR"] },
    })
  })

  it("dispatches both sources and categorization from a single call", async () => {
    const onExecute = jest.fn()
    const registry = createRetrievedChunksRegistry()
    const alias = registry.register(buildChunk({ chunkId: "chunk-1" }))
    const { config } = buildSessionMetadata()

    const sdkTool = submitTurnSummaryTool({
      retrievedChunksRegistry: registry,
      sessionMetadata: config,
      onExecute,
    })
    await sdkTool.execute?.(
      { chunkIds: [alias], categoryNames: ["HR"], suggestedTitle: null },
      {} as never,
    )

    expect(onExecute).toHaveBeenCalledTimes(2)
    expect(onExecute.mock.calls.map((call) => call[0].toolName)).toEqual([
      "sources",
      "recalculateConversationSessionMetadata",
    ])
  })

  it("skips the sources log when chunkIds is empty (no knowledge base used)", async () => {
    const onExecute = jest.fn()
    const { config } = buildSessionMetadata()

    const sdkTool = submitTurnSummaryTool({
      retrievedChunksRegistry: createRetrievedChunksRegistry(),
      sessionMetadata: config,
      onExecute,
    })
    await sdkTool.execute?.({ chunkIds: [], categoryNames: [], suggestedTitle: null }, {} as never)

    expect(onExecute).toHaveBeenCalledTimes(1)
    expect(onExecute.mock.calls[0]?.[0].toolName).toBe("recalculateConversationSessionMetadata")
  })

  it("reports unknown chunkIds instead of inventing sources", async () => {
    const onExecute = jest.fn()
    const registry = createRetrievedChunksRegistry()
    const alias = registry.register(buildChunk({ chunkId: "chunk-1" }))

    const sdkTool = submitTurnSummaryTool({ retrievedChunksRegistry: registry, onExecute })
    await sdkTool.execute?.({ chunkIds: [alias, "c99"] }, {} as never)

    const loggedArguments = onExecute.mock.calls[0]?.[0]?.arguments
    expect(loggedArguments.sources).toHaveLength(1)
    expect(loggedArguments.unknownChunkIds).toEqual(["c99"])
  })

  it("truncates long chunk content in the logged excerpt", async () => {
    const onExecute = jest.fn()
    const registry = createRetrievedChunksRegistry()
    registry.register(buildChunk({ chunkId: "chunk-1", content: "x".repeat(2000) }))

    const sdkTool = submitTurnSummaryTool({ retrievedChunksRegistry: registry, onExecute })
    await sdkTool.execute?.({ chunkIds: ["c1"] }, {} as never)

    const partialContent = onExecute.mock.calls[0]?.[0]?.arguments.sources[0].chunks[0]
      .partialContent as string
    expect(partialContent.length).toBeLessThanOrEqual(501)
    expect(partialContent.endsWith("…")).toBe(true)
  })

  it("keeps returning the logging-only system message", async () => {
    const onExecute = jest.fn()
    const sdkTool = submitTurnSummaryTool({
      retrievedChunksRegistry: createRetrievedChunksRegistry(),
      onExecute,
    })
    const result = await sdkTool.execute?.({ chunkIds: [] }, {} as never)

    expect(result).toEqual({
      role: "system",
      content: expect.stringContaining("Report received"),
      // Nothing was recorded: flagged so the end-of-turn guarantee retries.
      endOfTurnNoOp: true,
      // Registry snapshot for the end-of-turn freshness check.
      sawKnowledgeBaseChunks: false,
    })
  })
})

describe("submitTurnSummaryTool - runtime-dynamic schema", () => {
  it("declares chunkIds (and mentions it) only once the registry has chunks", () => {
    const registry = createRetrievedChunksRegistry()
    const sdkTool = submitTurnSummaryTool({
      retrievedChunksRegistry: registry,
      onExecute: () => undefined,
    })

    // Before any lookup: no chunkIds in the schema, none in the description.
    expect(JSON.stringify(z.toJSONSchema(sdkTool.inputSchema as z.ZodType))).not.toContain(
      "chunkIds",
    )
    expect(sdkTool.description).not.toContain("chunk")

    registry.register(buildChunk({ chunkId: "chunk-1" }))

    // After a lookup registered chunks: chunkIds appears in both.
    expect(JSON.stringify(z.toJSONSchema(sdkTool.inputSchema as z.ZodType))).toContain("chunkIds")
    expect(sdkTool.description).toContain("Never invent an id")
  })
})

describe("submitTurnSummaryTool - categories depend on the agent", () => {
  it("declares suggestedTitle alone when the agent has no categories", () => {
    const { config } = buildSessionMetadata()
    const sdkTool = submitTurnSummaryTool({
      sessionMetadata: { ...config, availableCategoryNames: [] },
      onExecute: () => undefined,
    })

    const schema = JSON.stringify(z.toJSONSchema(sdkTool.inputSchema as z.ZodType))
    expect(schema).toContain("suggestedTitle")
    expect(schema).not.toContain("categoryNames")
    expect(sdkTool.description).not.toContain("category")
  })

  it("declares categoryNames with the agent's enum when categories exist", () => {
    const { config } = buildSessionMetadata()
    const sdkTool = submitTurnSummaryTool({
      sessionMetadata: config,
      onExecute: () => undefined,
    })

    const schema = JSON.stringify(z.toJSONSchema(sdkTool.inputSchema as z.ZodType))
    expect(schema).toContain("suggestedTitle")
    expect(schema).toContain("categoryNames")
    expect(schema).toContain('"HR"')
  })
})

describe("submitTurnSummaryExecutionCounts", () => {
  it("keeps executions that saw the chunks, and any execution without the marker", () => {
    const registry = createRetrievedChunksRegistry()
    registry.register(buildChunk({ chunkId: "chunk-1" }))
    const executionCounts = submitTurnSummaryExecutionCounts(registry)

    expect(
      executionCounts({
        toolName: "submit_turn_summary",
        output: { sawKnowledgeBaseChunks: true },
      }),
    ).toBe(true)
    expect(executionCounts({ toolName: "other_tool", output: {} })).toBe(true)
  })

  it("invalidates a report submitted before the lookup registered chunks", () => {
    const registry = createRetrievedChunksRegistry()
    const executionCounts = submitTurnSummaryExecutionCounts(registry)
    const prematureOutput = { sawKnowledgeBaseChunks: false }

    // No chunks registered by end of turn (greeting): the execution counts.
    expect(executionCounts({ toolName: "submit_turn_summary", output: prematureOutput })).toBe(true)

    // A lookup later filled the registry: the same execution is now stale.
    registry.register(buildChunk({ chunkId: "chunk-1" }))
    expect(executionCounts({ toolName: "submit_turn_summary", output: prematureOutput })).toBe(
      false,
    )
  })
})

describe("submitTurnSummaryDescription", () => {
  it("carries the full sources contract (chunk ids + no inline citations) only when sources are enabled", () => {
    const description = submitTurnSummaryDescription({
      includeSources: true,
      includeCategories: false,
    })
    expect(description).toContain("Never invent an id")
    expect(description).toContain("Do NOT cite sources inline")
    expect(description).not.toContain("category")

    const withoutSources = submitTurnSummaryDescription({
      includeSources: false,
      includeCategories: false,
    })
    expect(withoutSources).not.toContain("Do NOT cite sources inline")
  })

  it("mentions categories only when session metadata is enabled", () => {
    const description = submitTurnSummaryDescription({
      includeSources: false,
      includeCategories: true,
    })
    expect(description).toContain("category set")
    expect(description).not.toContain("Never invent an id")
  })

  it("demands the call on every response including trivial turns, with no escape hatch", () => {
    const description = submitTurnSummaryDescription({
      includeSources: true,
      includeCategories: true,
    })
    expect(description).toContain("EVERY response")
    expect(description).toContain("greetings")
    expect(description).toContain("SAME response")
    expect(description).not.toContain("invoked automatically")
  })
})

describe("submitTurnSummaryInstruction", () => {
  it("is a short generic reminder: no sources or categories content in the prompt", () => {
    const instruction = submitTurnSummaryInstruction()
    expect(instruction).toContain("EVERY response")
    expect(instruction).toContain("greetings")
    expect(instruction).not.toContain("category set")
    expect(instruction).not.toContain("invoked automatically")
    expect(instruction).not.toContain("sources")
  })
})
