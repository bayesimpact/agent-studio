import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL)
  const httpsOptions = loadHttpsCertificates()
  const app = await NestFactory.create(AppModule, {
    ...(httpsOptions && { httpsOptions }),
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
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
  console.log(`API server running on ${protocol}://connect.localhost:3000`)
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
