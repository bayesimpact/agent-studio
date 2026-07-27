import { DEFAULT_TOP_K, lookupKnowledgeBaseTool } from "./lookup-knowledge-base.tool"

describe("lookupKnowledgeBaseTool", () => {
  it("retrieves chunks for a query alone", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([]),
    }

    const sdkTool = lookupKnowledgeBaseTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      retrievalService: retrievalService as never,
      onExecute,
    })

    await sdkTool.execute?.(
      {
        query: "Combien d'enfants sont restes sans solution ?",
      },
      {} as never,
    )

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      query: "Combien d'enfants sont restes sans solution ?",
      topK: DEFAULT_TOP_K,
      documentTagIds: [],
    })
  })

  it("retrieves chunks and returns metadata", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([
        {
          chunkId: "chunk-1",
          documentId: "document-1",
          documentTitle: "Onboarding Guide",
          documentFileName: "guide.pdf",
          chunkIndex: 2,
          content: "The onboarding process lasts two weeks.",
          distance: 0.09,
          modelName: "gemini-embedding-001",
        },
      ]),
    }

    const sdkTool = lookupKnowledgeBaseTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      retrievalService: retrievalService as never,
      onExecute,
    })

    const result = (await sdkTool.execute?.(
      {
        query: "How long does onboarding take?",
      },
      {} as never,
    )) as {
      retrievedChunks: unknown[]
      retrievalMetadata: {
        returnedChunkCount: number
        topK: number
      }
    }
    expect(result).toBeDefined()

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      query: "How long does onboarding take?",
      topK: DEFAULT_TOP_K,
      documentTagIds: [],
    })
    expect(onExecute).toHaveBeenCalledWith({
      toolName: "lookup_knowledge_base",
      arguments: {
        query: "How long does onboarding take?",
        topK: DEFAULT_TOP_K,
        documentTagIds: [],
        returnedChunkCount: 1,
        chunkIds: ["chunk-1"],
        documentIds: ["document-1"],
      },
    })
    expect(result.retrievalMetadata).toEqual({
      returnedChunkCount: 1,
      topK: DEFAULT_TOP_K,
    })
  })

  it("passes agent document tags to retrieval", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([]),
    }

    const sdkTool = lookupKnowledgeBaseTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      documentTagIds: ["tag-1", "tag-2"],
      retrievalService: retrievalService as never,
      onExecute,
    })

    await sdkTool.execute?.(
      {
        query: "Question",
      },
      {} as never,
    )

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      query: "Question",
      topK: DEFAULT_TOP_K,
      documentTagIds: ["tag-1", "tag-2"],
    })
    expect(onExecute).toHaveBeenCalledWith({
      toolName: "lookup_knowledge_base",
      arguments: {
        query: "Question",
        topK: DEFAULT_TOP_K,
        documentTagIds: ["tag-1", "tag-2"],
        returnedChunkCount: 0,
        chunkIds: [],
        documentIds: [],
      },
    })
  })
})
