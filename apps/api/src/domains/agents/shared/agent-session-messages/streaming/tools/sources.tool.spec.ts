import type { RetrievedDocumentChunk } from "@/domains/documents/embeddings/document-chunk.types"
import { RetrievedPassageRegistry } from "./retrieved-passage-registry"
import { sourcesTool } from "./sources.tool"

const buildChunk = (overrides: Partial<RetrievedDocumentChunk> = {}): RetrievedDocumentChunk => ({
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
  ...overrides,
})

describe("sourcesTool", () => {
  const buildTool = (chunks: RetrievedDocumentChunk[]) => {
    const onExecute = jest.fn()
    const passageRegistry = new RetrievedPassageRegistry()
    passageRegistry.register(chunks)
    return { onExecute, sdkTool: sourcesTool({ passageRegistry, onExecute }) }
  }

  it("rebuilds ids, titles and quotes from the retrieved passages", async () => {
    const { onExecute, sdkTool } = buildTool([
      buildChunk({ chunkId: "chunk-1", content: "Onboarding lasts two weeks." }),
      buildChunk({
        chunkId: "chunk-2",
        documentId: "document-2",
        documentTitle: "Crawled Page",
        documentSourceType: "webCrawl",
        content: "Remote onboarding is fully supported.",
      }),
    ])

    const result = await sdkTool.execute?.({ refs: [1, 2] }, {} as never)

    expect(onExecute).toHaveBeenCalledWith({
      toolName: "sources",
      arguments: {
        sources: [
          {
            documentId: "document-1",
            documentTitle: "Onboarding Guide",
            documentSourceType: "project",
            chunks: [{ chunkId: "chunk-1", partialContent: "Onboarding lasts two weeks." }],
          },
          {
            documentId: "document-2",
            documentTitle: "Crawled Page",
            documentSourceType: "webCrawl",
            chunks: [
              { chunkId: "chunk-2", partialContent: "Remote onboarding is fully supported." },
            ],
          },
        ],
      },
    })
    expect(result).toEqual(expect.objectContaining({ shownSourceCount: 2 }))
  })

  it("groups the passages of one document under a single source", async () => {
    const { onExecute, sdkTool } = buildTool([
      buildChunk({ chunkId: "chunk-1", content: "First passage." }),
      buildChunk({ chunkId: "chunk-2", content: "Second passage." }),
    ])

    await sdkTool.execute?.({ refs: [1, 2] }, {} as never)

    const [[execution]] = onExecute.mock.calls as [[{ arguments: { sources: unknown[] } }]]
    expect(execution.arguments.sources).toEqual([
      expect.objectContaining({
        documentId: "document-1",
        chunks: [
          { chunkId: "chunk-1", partialContent: "First passage." },
          { chunkId: "chunk-2", partialContent: "Second passage." },
        ],
      }),
    ])
  })

  it("drops refs the model invented instead of persisting broken sources", async () => {
    const { onExecute, sdkTool } = buildTool([buildChunk({ chunkId: "chunk-1" })])

    const result = await sdkTool.execute?.({ refs: [1, 42] }, {} as never)

    const [[execution]] = onExecute.mock.calls as [[{ arguments: { sources: unknown[] } }]]
    expect(execution.arguments.sources).toHaveLength(1)
    expect(result).toEqual(expect.objectContaining({ shownSourceCount: 1 }))
  })

  it("shows nothing when no ref matches a retrieved passage", async () => {
    const { onExecute, sdkTool } = buildTool([buildChunk({ chunkId: "chunk-1" })])

    const result = await sdkTool.execute?.({ refs: [8, 9] }, {} as never)

    expect(onExecute).not.toHaveBeenCalled()
    expect(result).toEqual(expect.objectContaining({ shownSourceCount: 0 }))
  })

  it("caps a long passage excerpt", async () => {
    const { onExecute, sdkTool } = buildTool([
      buildChunk({ chunkId: "chunk-1", content: "a".repeat(5_000) }),
    ])

    await sdkTool.execute?.({ refs: [1] }, {} as never)

    const [[execution]] = onExecute.mock.calls as [
      [{ arguments: { sources: { chunks: { partialContent: string }[] }[] } }],
    ]
    const excerpt = execution.arguments.sources[0]?.chunks[0]?.partialContent ?? ""
    expect(excerpt.length).toBeLessThan(5_000)
    expect(excerpt.endsWith("[…]")).toBe(true)
  })
})
