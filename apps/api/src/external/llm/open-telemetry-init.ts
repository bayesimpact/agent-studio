import "dotenv/config"
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core"
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"

const isProduction = process.env.NODE_ENV === "production"
const isTest = process.env.NODE_ENV === "test"

const spanProcessors = [
  new BatchSpanProcessor(
    new LangfuseIntegrationExporter({
      secretKey: process.env.LANGFUSE_SK,
      publicKey: process.env.LANGFUSE_PK,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    }),
  ),
]

if (isProduction) {
  spanProcessors.push(new BatchSpanProcessor(new TraceExporter()))
} else if (!isTest) {
  spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()))
}

export const sdk = new NodeSDK({
  spanProcessors,
  instrumentations: isTest
    ? []
    : [new HttpInstrumentation(), new NestInstrumentation(), new PgInstrumentation()],
})

sdk.start()
