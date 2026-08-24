import { PUBLIC_PATH_PREFIX } from "@caseai-connect/api-contracts"
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from "@nestjs/common/interfaces/external/cors-options.interface"

const DEFAULT_LOCAL_FRONTEND_URLS = [
  // `vite dev` and `vite preview` — see apps/web/vite.config.ts.
  "https://connect.localhost:5173",
  "https://connect.localhost:5174",
]

/**
 * Parses `FRONTEND_URL` into a list of CORS origins. Accepts a single URL or
 * a comma-separated list. Each entry is trimmed and normalized to https://
 * if no scheme is given. When the env var is unset and we're not in
 * production, falls back to the local dev/preview URLs so a fresh checkout
 * works without extra `.env` setup. In production, an unset env var yields
 * an empty array (no origins allowed).
 */
export function parseFrontendUrls(
  frontendUrl: string | undefined,
  isProduction: boolean,
): string[] {
  if (!frontendUrl) {
    return isProduction ? [] : DEFAULT_LOCAL_FRONTEND_URLS
  }
  return frontendUrl
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) =>
      url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`,
    )
}

/**
 * CORS strategy — two policies, split by path (#366):
 * - Public embed endpoints (/public/*) are designed to be called from
 *   arbitrary host pages, so the request origin is reflected. Their security
 *   is enforced by EmbedTokenGuard (embed token + per-config allowedOrigins
 *   check), not by CORS. Reflecting the origin (instead of '*') is required
 *   because some browsers are stricter with '*' when custom headers
 *   (X-Session-Token) are present.
 * - Everything else only serves the platform front ends, so origins are
 *   pinned to the FRONTEND_URL list. These endpoints are secured by Auth0
 *   Bearer tokens; the one cookie-authenticated surface (Bull Board's OIDC
 *   session) is covered by this strict policy too.
 * No caller sends cookies or uses `credentials: 'include'`, so credentialed
 * CORS stays off.
 */
export function buildCorsOptionsDelegate(
  frontendUrls: string[],
): CorsOptionsDelegate<{ url?: string }> {
  return (req, callback: (error: Error | null, options: CorsOptions) => void) => {
    const isPublicEmbed = req.url?.startsWith(`/${PUBLIC_PATH_PREFIX}/`) ?? false
    callback(null, { origin: isPublicEmbed ? true : frontendUrls })
  }
}
