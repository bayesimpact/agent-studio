import { createVertex } from "@ai-sdk/google-vertex"
import { AgentProvider } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import type { LanguageModel } from "ai"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { AISDKLLMProviderBase, type CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"

@Injectable()
export class AISDKVertexProvider extends AISDKLLMProviderBase {
  getAgentProvider(): AgentProvider {
    return AgentProvider.Vertex
  }
  private readonly vertexProvider: ReturnType<typeof createVertex>
  private readonly vertexProject: string
  private readonly vertexLocation: string

  constructor() {
    super()
    this.vertexProject = process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect"
    this.vertexLocation = process.env.GOOGLE_VERTEX_LOCATION || "europe-west1"
    if (process.env.IS_TEST === "true") {
      this.vertexProvider = createVertex({
        project: this.vertexProject,
        location: this.vertexLocation,
      })
    } else
      this.vertexProvider = createVertex({
        project: this.vertexProject,
        location: this.vertexLocation,
      })
  }

  getLanguageModel({ config }: { config: LLMConfig; callOrigin: CallOrigin }): LanguageModel {
    return this.vertexProvider(config.model)
  }
  getTags(config: LLMConfig): string[] {
    return [this.vertexProject, this.vertexLocation, config.model]
  }
}
