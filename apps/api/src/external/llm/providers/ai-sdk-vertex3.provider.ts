import { createVertex } from "@ai-sdk/google-vertex"
import {
  AgentModel,
  AgentProvider,
  isAgentModelServedOutsideEu,
} from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import type { LanguageModel } from "ai"
import { Agent, fetch as undiciFetch } from "undici"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { AISDKLLMProviderBase, type CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"

// Default network timeouts (ms) applied to the extended-timeout fetch when the
// corresponding env vars are unset. Sized for long-running calls such as
// extraction agent runs.
const DEFAULT_HEADERS_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const DEFAULT_BODY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const DEFAULT_CONNECT_TIMEOUT_MS = 30 * 1000 // 30 seconds

function readTimeoutMs(value: string | undefined, defaultMs: number): number {
  if (!value) return defaultMs
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultMs : parsed
}

/**
 * Models NOT yet served on the EU regional endpoint (verified 2026-07-30:
 * 404 on aiplatform.eu.rep.googleapis.com, while 3.5-flash, 3.5-flash-lite
 * and 3.1-flash-lite all answer there) — they can only run through the
 * "global" endpoint, which does NOT guarantee EU data processing. Every
 * other model stays on "eu" (data residency).
 *
 * The list is derived from `servedOutsideEu` in `AgentModelMetadataMap`, the
 * shared catalog that also drives the "(non-EU)" label in the model pickers.
 * When Google opens EU serving for a model, clear the flag there — this
 * routing and the UI label follow from the same fact.
 */
const GLOBAL_ONLY_MODELS: string[] = Object.values(AgentModel).filter((model) =>
  isAgentModelServedOutsideEu(model),
)

type VertexLocation = "eu" | "global"

function locationForModel(model: string): VertexLocation {
  return GLOBAL_ONLY_MODELS.includes(model) ? "global" : "eu"
}

@Injectable()
export class AISDKVertex3Provider extends AISDKLLMProviderBase {
  getAgentProvider(): AgentProvider {
    return AgentProvider.Vertex3
  }

  /**
   * Gemini enforces tool argument schemas for strict tools (mode VALIDATED):
   * enums hold even under adversarial user injections, while the model still
   * answers with text in the same generation — measured on 3.6-flash and
   * 3.5-flash-lite (probe 2026-07-30). Length constraints are NOT enforced;
   * Zod remains the application-side barrier.
   */
  protected override supportsStrictTools(): boolean {
    return true
  }
  private readonly vertexProviders: Record<VertexLocation, ReturnType<typeof createVertex>>
  private readonly vertexProvidersWithExtendedTimeouts: Record<
    VertexLocation,
    ReturnType<typeof createVertex>
  >
  private readonly vertexProject: string

  constructor() {
    super()
    this.vertexProject = process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect"

    // One provider per location: models run on "eu" (EU data residency)
    // unless they are only served globally — see GLOBAL_ONLY_MODELS.
    const buildProvider = (location: VertexLocation, fetch?: typeof undiciFetch) =>
      createVertex({
        project: this.vertexProject,
        location,
        ...(fetch ? { fetch: fetch as unknown as typeof globalThis.fetch } : {}),
      })

    // Default providers: rely on the AI SDK / undici default fetch timeouts.
    this.vertexProviders = {
      eu: buildProvider("eu"),
      global: buildProvider("global"),
    }

    // Extended-timeout providers: opt-in via `config.useExtendedTimeouts` for
    // long-running calls (e.g. extraction agent runs). The three timeouts are
    // configurable through env vars; a single dispatcher is reused across calls.
    const extendedTimeoutDispatcher = new Agent({
      headersTimeout: readTimeoutMs(
        process.env.VERTEX_FETCH_HEADERS_TIMEOUT_MS,
        DEFAULT_HEADERS_TIMEOUT_MS,
      ),
      bodyTimeout: readTimeoutMs(process.env.VERTEX_FETCH_BODY_TIMEOUT_MS, DEFAULT_BODY_TIMEOUT_MS),
      connectTimeout: readTimeoutMs(
        process.env.VERTEX_FETCH_CONNECT_TIMEOUT_MS,
        DEFAULT_CONNECT_TIMEOUT_MS,
      ),
    })
    const extendedTimeoutFetch: typeof undiciFetch = (url, options) =>
      undiciFetch(url, { ...options, dispatcher: extendedTimeoutDispatcher })
    this.vertexProvidersWithExtendedTimeouts = {
      eu: buildProvider("eu", extendedTimeoutFetch),
      global: buildProvider("global", extendedTimeoutFetch),
    }
  }

  getLanguageModel({ config }: { config: LLMConfig; callOrigin: CallOrigin }): LanguageModel {
    const location = locationForModel(config.model)
    const provider = config.useExtendedTimeouts
      ? this.vertexProvidersWithExtendedTimeouts[location]
      : this.vertexProviders[location]
    return provider(config.model)
  }
  getTags(config: LLMConfig): string[] {
    return [this.vertexProject, locationForModel(config.model), config.model]
  }
}
