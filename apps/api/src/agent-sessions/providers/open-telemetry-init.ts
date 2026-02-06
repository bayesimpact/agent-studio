import "dotenv/config"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"

const sdk = new NodeSDK({
  spanProcessors: [
    new BatchSpanProcessor(new ConsoleSpanExporter()),
    new BatchSpanProcessor(
      new LangfuseIntegrationExporter({
        secretKey: process.env.LANGFUSE_SK,
        publicKey: process.env.LANGFUSE_PK,
        baseUrl: process.env.LANGFUSE_BASE_URL,
      }),
    ),
  ],
})

sdk.start()
