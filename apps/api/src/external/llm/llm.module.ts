import { Module } from "@nestjs/common"
import { AISDKMockProvider } from "@/external/llm/providers/ai-sdk-mock.provider"
import { AISDKVertexProvider } from "@/external/llm/providers/ai-sdk-vertex.provider"

@Module({
  providers: [
    {
      provide: "VertexLLMProvider",
      useClass: AISDKVertexProvider,
    },
    {
      provide: "_MockLLMProvider",
      useClass: AISDKMockProvider,
    },
  ],
  exports: ["VertexLLMProvider", "_MockLLMProvider"],
})
export class LlmModule {}
