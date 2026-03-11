import { embed } from "ai"
import { DocumentChunkRetrievalService } from "./document-chunk-retrieval.service"

const mockTextEmbeddingModel = jest.fn()
const mockCreateVertex = jest.fn((_config?: unknown) => ({
  textEmbeddingModel: mockTextEmbeddingModel,
}))

jest.mock("@ai-sdk/google-vertex", () => ({
  createVertex: (config: unknown) => mockCreateVertex(config),
}))

jest.mock("ai", () => ({
  embed: jest.fn(),
}))

describe("DocumentChunkRetrievalService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GCP_PROJECT = "test-project"
    process.env.GOOGLE_VERTEX_LOCATION = "us-central1"
    process.env.DOCUMENT_EMBEDDING_MODELS = "gemini-embedding-001"
    mockTextEmbeddingModel.mockReturnValue("embedding-model")
  })

  it("retrieves top chunks for a project scope", async () => {
    const query = jest.fn().mockResolvedValue([
      {
        chunkId: "chunk-1",
        documentId: "document-1",
        documentTitle: "Handbook",
        documentFileName: "handbook.pdf",
        chunkIndex: 0,
        content: "Relevant policy details",
        distance: 0.12,
        modelName: "gemini-embedding-001",
      },
    ])
    const mockedEmbed = embed as jest.MockedFunction<typeof embed>
    mockedEmbed.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    } as never)

    const service = new DocumentChunkRetrievalService({
      query,
    } as never)

    const chunks = await service.retrieveTopChunks({
      connectScope: {
        organizationId: "organization-1",
        projectId: "project-1",
      },
      conversationSummary: "User discussed parental leave policy.",
      latestUserQuestion: "What documents mention paid leave duration?",
      topK: 3,
    })

    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.documentId).toBe("document-1")
    expect(mockCreateVertex).toHaveBeenCalledWith({
      project: "test-project",
      location: "us-central1",
    })
    expect(mockTextEmbeddingModel).toHaveBeenCalledWith("gemini-embedding-001")
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0]?.[1]?.[4]).toBe(3)
  })
})
