import type { RetrievedDocumentChunk } from "@/domains/documents/embeddings/document-chunk.types"
import { RetrievedPassageRegistry } from "./retrieved-passage-registry"

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

describe("RetrievedPassageRegistry", () => {
  it("numbers passages from 1 and keeps counting across lookups", () => {
    const registry = new RetrievedPassageRegistry()

    const firstLookup = registry.register([
      buildChunk({ chunkId: "chunk-1" }),
      buildChunk({ chunkId: "chunk-2" }),
    ])
    const secondLookup = registry.register([buildChunk({ chunkId: "chunk-3" })])

    expect(firstLookup.map((passage) => passage.ref)).toEqual([1, 2])
    expect(secondLookup.map((passage) => passage.ref)).toEqual([3])
  })

  it("reuses the ref of a chunk retrieved again by a later lookup", () => {
    const registry = new RetrievedPassageRegistry()

    registry.register([buildChunk({ chunkId: "chunk-1" }), buildChunk({ chunkId: "chunk-2" })])
    const secondLookup = registry.register([
      buildChunk({ chunkId: "chunk-2" }),
      buildChunk({ chunkId: "chunk-3" }),
    ])

    expect(secondLookup.map((passage) => passage.ref)).toEqual([2, 3])
  })

  it("resolves refs to the retrieved chunks, in ref order and without duplicates", () => {
    const registry = new RetrievedPassageRegistry()
    registry.register([
      buildChunk({ chunkId: "chunk-1" }),
      buildChunk({ chunkId: "chunk-2", documentId: "document-2" }),
    ])

    const { passages, unknownRefs } = registry.resolve([2, 1, 2])

    expect(passages.map((passage) => passage.chunkId)).toEqual(["chunk-1", "chunk-2"])
    expect(unknownRefs).toEqual([])
  })

  it("reports refs that were never retrieved instead of returning them", () => {
    const registry = new RetrievedPassageRegistry()
    registry.register([buildChunk({ chunkId: "chunk-1" })])

    const { passages, unknownRefs } = registry.resolve([1, 7])

    expect(passages.map((passage) => passage.ref)).toEqual([1])
    expect(unknownRefs).toEqual([7])
  })

  it("resolves nothing when no lookup ran", () => {
    const registry = new RetrievedPassageRegistry()

    expect(registry.resolve([1, 2])).toEqual({ passages: [], unknownRefs: [1, 2] })
  })
})
