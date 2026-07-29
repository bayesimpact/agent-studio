import type { RetrievedDocumentChunk } from "@/domains/documents/embeddings/document-chunk.types"

/**
 * Per-request registry of the chunks returned by lookup_knowledge_base.
 *
 * Each registered chunk gets a short sequential alias (c1, c2, ...) — the
 * ONLY id the model ever sees. UUIDs are unreliable for small models to copy
 * (a single dropped character silently loses the source) and cost ~15 tokens
 * each; a 2-character alias is practically un-manglable. The submit_turn_summary
 * tool resolves the cited aliases back to the real chunks server-side, so
 * persisted sources keep their real UUIDs.
 *
 * Purely in-memory and request-scoped: built once per streaming turn in
 * ToolsService and garbage-collected with it. Aliases restart at c1 on every
 * turn, which is safe because previous turns' tool results are never part of
 * the LLM-visible history (see llm-visible-message.helper.ts). If past
 * retrievals ever get injected into the history, aliases from different
 * turns would collide — the mapping would then need a per-turn prefix or
 * session persistence.
 */
export type RetrievedChunksRegistry = {
  /** Registers a chunk and returns its model-facing alias (c1, c2, ...). */
  register(chunk: RetrievedDocumentChunk): string
  /** Resolves a model-cited alias (case/whitespace tolerant). */
  get(alias: string): RetrievedDocumentChunk | undefined
}

export function createRetrievedChunksRegistry(): RetrievedChunksRegistry {
  const chunksByAlias = new Map<string, RetrievedDocumentChunk>()
  return {
    register(chunk) {
      const alias = `c${chunksByAlias.size + 1}`
      chunksByAlias.set(alias, chunk)
      return alias
    },
    get(alias) {
      return chunksByAlias.get(alias.trim().toLowerCase())
    },
  }
}
