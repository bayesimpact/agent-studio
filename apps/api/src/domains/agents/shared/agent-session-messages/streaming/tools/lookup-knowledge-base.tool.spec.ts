import { DEFAULT_TOP_K, lookupKnowledgeBaseTool } from "./lookup-knowledge-base.tool"
import { RetrievedPassageRegistry } from "./retrieved-passage-registry"

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
      passageRegistry: new RetrievedPassageRegistry(),
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

  it("returns citable passages and keeps ids out of the model's view", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([
        {
          chunkId: "chunk-1",
          documentId: "document-1",
          documentTitle: "Onboarding Guide",
          documentFileName: "guide.pdf",
          documentSourceType: "project",
          chunkIndex: 2,
          content: "The onboarding process lasts two weeks.",
          distance: 0.09,
          modelName: "gemini-embedding-001",
          isParentChunk: false,
        },
      ]),
    }

    const passageRegistry = new RetrievedPassageRegistry()
    const sdkTool = lookupKnowledgeBaseTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      passageRegistry,
      retrievalService: retrievalService as never,
      onExecute,
    })

    const result = (await sdkTool.execute?.(
      {
        query: "How long does onboarding take?",
      },
      {} as never,
    )) as {
      passages: { ref: number; documentTitle: string; content: string }[]
    }

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      query: "How long does onboarding take?",
      topK: DEFAULT_TOP_K,
      documentTagIds: [],
    })
    // The execution log keeps the real ids for tracing…
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
    // …while the model only gets a ref to cite, so it cannot mistype an id.
    expect(result.passages).toEqual([
      {
        ref: 1,
        documentTitle: "Onboarding Guide",
        content: "The onboarding process lasts two weeks.",
      },
    ])
    expect(passageRegistry.resolve([1]).passages[0]?.chunkId).toBe("chunk-1")
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
      passageRegistry: new RetrievedPassageRegistry(),
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
