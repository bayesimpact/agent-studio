import type { RetrievedDocumentChunk } from "@/domains/documents/embeddings/document-chunk.types"

/** A retrieved chunk plus the short number the model cites it with. */
export type RetrievedPassage = RetrievedDocumentChunk & { ref: number }

/**
 * Per-turn store of the passages the knowledge base returned, keyed by the small
 * `ref` number the model sees.
 *
 * The model is never shown a chunk id or a document id: it cites passages by ref,
 * and {@link RetrievedPassageRegistry.resolve} maps those refs back to the real
 * records. Ids, titles, source types and quoted content therefore always come from
 * the retrieval itself and can no longer be mistyped or invented by the model.
 *
 * One registry is created per built tool set (i.e. per agent turn) and shared by
 * the lookup tool that fills it and the sources tool that reads it. Refs keep
 * increasing across successive lookups within the turn, and a chunk retrieved
 * again by a later lookup keeps its original ref.
 */
export class RetrievedPassageRegistry {
  private readonly passagesByRef = new Map<number, RetrievedPassage>()
  private readonly refsByChunkId = new Map<string, number>()

  /** Registers the chunks of one lookup and returns them with their refs. */
  register(chunks: RetrievedDocumentChunk[]): RetrievedPassage[] {
    return chunks.map((chunk) => this.registerChunk(chunk))
  }

  /**
   * Resolves the refs cited by the model, in ref order, dropping duplicates and
   * refs that were never retrieved during this turn.
   */
  resolve(refs: number[]): { passages: RetrievedPassage[]; unknownRefs: number[] } {
    const passages: RetrievedPassage[] = []
    const unknownRefs: number[] = []

    for (const ref of new Set(refs)) {
      const passage = this.passagesByRef.get(ref)
      if (passage) passages.push(passage)
      else unknownRefs.push(ref)
    }

    return { passages: passages.sort((left, right) => left.ref - right.ref), unknownRefs }
  }

  private registerChunk(chunk: RetrievedDocumentChunk): RetrievedPassage {
    const knownRef = this.refsByChunkId.get(chunk.chunkId)
    const alreadyRegistered = knownRef === undefined ? undefined : this.passagesByRef.get(knownRef)
    if (alreadyRegistered) return alreadyRegistered

    const ref = this.passagesByRef.size + 1
    const passage: RetrievedPassage = { ...chunk, ref }
    this.passagesByRef.set(ref, passage)
    this.refsByChunkId.set(chunk.chunkId, ref)
    return passage
  }
}
