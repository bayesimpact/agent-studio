import { PUBLIC_PATH_PREFIX } from "@caseai-connect/api-contracts"
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from "@nestjs/common/interfaces/external/cors-options.interface"

/**
 * Any port on the two local hosts the front end is served from — `vite dev`
 * and `vite preview` ports are configurable per checkout (FRONT_PORT and
 * FRONT_PREVIEW_PORT in apps/web/.env), and worktrees override them to run
 * side by side, so pinning specific ports here breaks as soon as a developer
 * moves off the defaults. Only ever reached outside production.
 */
const LOCAL_FRONTEND_ORIGIN_PATTERNS = [
  // With certs: `https://connect.localhost:<port>` — see apps/web/vite.config.ts.
  /^https:\/\/connect\.localhost:\d+$/,
]

/**
 * Parses `FRONTEND_URL` into a list of CORS origins. Accepts a single URL or
 * a comma-separated list. Each entry is trimmed and normalized to https://
 * if no scheme is given. When the list resolves to nothing (unset or blank)
 * outside production, falls back to the local dev/preview patterns so a fresh
 * checkout works without extra `.env` setup, on whichever port it runs. In
 * production the same case throws: an empty list would silently block every
 * browser call to the platform, whereas a crash at boot fails the Cloud Run
 * revision and keeps the previous one serving.
 */
export function parseFrontendOrigins(
  frontendUrl: string | undefined,
  isProduction: boolean,
): (string | RegExp)[] {
  const urls = (frontendUrl ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) =>
      url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`,
    )
  if (urls.length > 0) {
    return urls
  }
  if (isProduction) {
    throw new Error(
      "FRONTEND_URL must be set in production (comma-separated list of allowed CORS origins)",
    )
  }
  return LOCAL_FRONTEND_ORIGIN_PATTERNS
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
 *   pinned to the FRONTEND_URL origins. These endpoints are secured by Auth0
 *   Bearer tokens; the one cookie-authenticated surface (Bull Board's OIDC
 *   session) is covered by this strict policy too.
 * No caller sends cookies or uses `credentials: 'include'`, so credentialed
 * CORS stays off.
 */
export function buildCorsOptionsDelegate(
  frontendOrigins: (string | RegExp)[],
): CorsOptionsDelegate<{ url?: string }> {
  return (req, callback: (error: Error | null, options: CorsOptions) => void) => {
    const isPublicEmbed = req.url?.startsWith(`/${PUBLIC_PATH_PREFIX}/`) ?? false
    callback(null, { origin: isPublicEmbed ? true : frontendOrigins })
  }
}
