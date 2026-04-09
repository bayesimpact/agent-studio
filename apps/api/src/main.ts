import { readFileSync } from "node:fs"
import { join } from "node:path"
import { Logger, ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS
import { NestExpressApplication } from "@nestjs/platform-express"
import { AppModule } from "./app.module"
import { StackTraceLoggingExceptionFilter } from "./common/filters/stack-trace-logging-exception.filter"
import { getLogLevels, StructuredLogger } from "./common/logger/structured-logger"

const isProduction = process.env.NODE_ENV === "production"

async function bootstrap() {
  const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL)
  const httpsOptions = loadHttpsCertificates()
  const logLevels = getLogLevels()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction ? new StructuredLogger(logLevels) : logLevels,
    ...(httpsOptions && { httpsOptions }),
  })
  app.useBodyParser("json", { limit: "500kb" })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalFilters(new StackTraceLoggingExceptionFilter(app.getHttpAdapter()))
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
      "https://connect.localhost:5173",
      ...(frontendUrl ? [frontendUrl] : []),
    ],
    credentials: true,
  })
  const protocol = httpsOptions ? "https" : "http"
  await app.listen(3000)
  Logger.log(`API server running on ${protocol}://connect.localhost:3000`, "Bootstrap")
}

function normalizeFrontendUrl(frontendUrl: string | undefined): string | undefined {
  if (!frontendUrl) {
    return undefined
  }

  if (frontendUrl.startsWith("http://") || frontendUrl.startsWith("https://")) {
    return frontendUrl
  }

  return `https://${frontendUrl}`
}

/**
 * Loads HTTPS certificates from the .certs directory if they exist.
 * Returns undefined if certificates are not found (falls back to HTTP).
 */
function loadHttpsCertificates(): { key: Buffer; cert: Buffer } | undefined {
  try {
    const certsDir = join(__dirname, "..", ".certs")
    return {
      key: readFileSync(join(certsDir, "key.pem")),
      cert: readFileSync(join(certsDir, "cert.pem")),
    }
  } catch {
    return undefined
  }
}

void bootstrap()
