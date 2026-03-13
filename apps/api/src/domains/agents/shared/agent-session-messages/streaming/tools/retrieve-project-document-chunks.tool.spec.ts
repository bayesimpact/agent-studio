import { retrieveProjectDocumentChunksTool } from "./retrieve-project-document-chunks.tool"

describe("retrieveProjectDocumentChunksTool", () => {
  it("accepts an empty conversation summary for first-turn questions", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([]),
    }

    const sdkTool = retrieveProjectDocumentChunksTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      retrievalService: retrievalService as never,
      onExecute,
    })

    await sdkTool.execute?.(
      {
        conversationSummary: "",
        latestUserQuestion: "Combien d'enfants sont restes sans solution ?",
        topK: 3,
      },
      {} as never,
    )

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      conversationSummary: "",
      latestUserQuestion: "Combien d'enfants sont restes sans solution ?",
      topK: 3,
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

    const sdkTool = retrieveProjectDocumentChunksTool({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      retrievalService: retrievalService as never,
      onExecute,
    })

    const result = (await sdkTool.execute?.(
      {
        conversationSummary: "The user wants onboarding details.",
        latestUserQuestion: "How long does onboarding take?",
        topK: 3,
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
      conversationSummary: "The user wants onboarding details.",
      latestUserQuestion: "How long does onboarding take?",
      topK: 3,
      documentTagIds: [],
    })
    expect(onExecute).toHaveBeenCalledWith({
      toolName: "retrieveProjectDocumentChunks",
      arguments: {
        conversationSummary: "The user wants onboarding details.",
        latestUserQuestion: "How long does onboarding take?",
        topK: 3,
        documentTagIds: [],
        returnedChunkCount: 1,
        chunkIds: ["chunk-1"],
        documentIds: ["document-1"],
      },
    })
    expect(result.retrievalMetadata).toEqual({
      returnedChunkCount: 1,
      topK: 3,
    })
  })

  it("passes agent document tags to retrieval", async () => {
    const onExecute = jest.fn()
    const retrievalService = {
      retrieveTopChunks: jest.fn().mockResolvedValue([]),
    }

    const sdkTool = retrieveProjectDocumentChunksTool({
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
        conversationSummary: "Summary",
        latestUserQuestion: "Question",
        topK: 2,
      },
      {} as never,
    )

    expect(retrievalService.retrieveTopChunks).toHaveBeenCalledWith({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      conversationSummary: "Summary",
      latestUserQuestion: "Question",
      topK: 2,
      documentTagIds: ["tag-1", "tag-2"],
    })
    expect(onExecute).toHaveBeenCalledWith({
      toolName: "retrieveProjectDocumentChunks",
      arguments: {
        conversationSummary: "Summary",
        latestUserQuestion: "Question",
        topK: 2,
        documentTagIds: ["tag-1", "tag-2"],
        returnedChunkCount: 0,
        chunkIds: [],
        documentIds: [],
      },
    })
  })
})
