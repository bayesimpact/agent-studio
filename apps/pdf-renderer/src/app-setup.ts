import type { INestApplication } from "@nestjs/common"
import { raw } from "express"

// Maximum allowed PDF size for this service. Cloud Run rejects HTTP/1 requests larger than 32MiB before they reach the service.
const DEFAULT_MAX_PDF_BYTES = 50 * 1024 * 1024

export const resolveMaxPdfBytes = (): number =>
  Number(process.env.PDF_RENDERER_MAX_PDF_BYTES) || DEFAULT_MAX_PDF_BYTES

/**
 * The only request body this service accepts is raw pdf bytes: the default
 * json body parser is disabled at creation time (`bodyParser: false`) and
 * replaced by a raw parser scoped to application/pdf. Shared between main.ts
 * and the specs so both run the exact same http pipeline.
 */
export function configureApp(app: INestApplication): void {
  app.use(raw({ type: "application/pdf", limit: resolveMaxPdfBytes() }))
}
