import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
  getDoclingCommand,
  getDoclingTimeoutMs,
  getDoclingVersion,
  isDoclingEnabled,
} from "@/external/docling/docling.cli"
import { WorkersAppModule } from "./workers-app.module"

const WORKER_DOCLING_HEALTH_CHECK_TIMEOUT_MS = 30_000

async function bootstrapWorkersMain() {
  await ensureDoclingIsReadyForWorkers()
  await NestFactory.createApplicationContext(WorkersAppModule)
  Logger.log("Workers app started", "WorkersMain")
}

async function ensureDoclingIsReadyForWorkers(): Promise<void> {
  if (!isDoclingEnabled()) {
    Logger.log(
      "Docling check skipped because DOCUMENT_EXTRACTOR_DOCLING_ENABLED=false",
      "WorkersMain",
    )
    return
  }

  try {
    const version = await getDoclingVersion({
      timeoutMs: getDoclingTimeoutMs(WORKER_DOCLING_HEALTH_CHECK_TIMEOUT_MS),
    })
    Logger.log(`Docling health check passed (${version || "version unavailable"})`, "WorkersMain")
  } catch (error) {
    Logger.error(
      `Docling health check failed. Command "${getDoclingCommand()} --version" is not available or timed out.`,
      error instanceof Error ? error.stack : String(error),
      "WorkersMain",
    )
    throw error
  }
}

void bootstrapWorkersMain()
