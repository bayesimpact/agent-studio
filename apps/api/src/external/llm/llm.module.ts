import { Module } from "@nestjs/common"
import { AISDKMedGemmaProvider } from "@/external/llm/providers/ai-sdk-med-gemma.provider"
import { AISDKMockProvider } from "@/external/llm/providers/ai-sdk-mock.provider"
import { AISDKVertexProvider } from "@/external/llm/providers/ai-sdk-vertex.provider"

@Module({
  providers: [
    {
      provide: "VertexLLMProvider",
      useClass: AISDKVertexProvider,
    },
    {
      provide: "MedGemmaLLMProvider",
      useClass: AISDKMedGemmaProvider,
    },
    {
      provide: "_MockLLMProvider",
      useClass: AISDKMockProvider,
    },
  ],
  exports: ["MedGemmaLLMProvider", "VertexLLMProvider", "_MockLLMProvider"],
})
export class LlmModule {}
