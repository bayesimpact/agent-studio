import path from "node:path"
import { fileURLToPath } from "node:url"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import type { AstroUserConfig } from "astro"
import { defineConfig } from "astro/config"

import { DEFAULT_LOCALE, LOCALES, SITE_URL } from "./src/consts"

// SPIKE (PR #602 review) — importer-aware `@/` resolver. `apps/web` uses `@/` = its own
// `src`, while `apps/help` uses `@/` = help's `src`. When a module that physically lives
// under `apps/web/` imports `@/…`, resolve it against `apps/web/src` (so we can import the
// REAL app components/harness — Storybook-style — into a help-center island). Any other
// `@/` (i.e. from `apps/help`) is left to Astro's own tsconfig-paths resolution.
const APPS_WEB_SRC = fileURLToPath(new URL("../web/src", import.meta.url))
function appsWebAtAlias() {
  return {
    name: "apps-web-at-alias",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined) {
      if (!source.startsWith("@/") || !importer) return null
      if (!importer.replace(/\\/g, "/").includes("/apps/web/")) return null
      const abs = path.join(APPS_WEB_SRC, source.slice(2))
      const resolved = await (this as { resolve: (id: string, imp: string, o: object) => Promise<{ id: string } | null> }).resolve(abs, importer, { skipSelf: true })
      return resolved
    },
  }
}

// `@tailwindcss/vite` is typed against Vite 7 (hoisted for apps/web) while Astro
// bundles Vite 6. The plugin is runtime-compatible with both; this bridges the
// duplicated Vite type definitions so the config type-checks against Astro's Vite.
type VitePlugins = NonNullable<NonNullable<AstroUserConfig["vite"]>["plugins"]>
const vitePlugins = [appsWebAtAlias(), tailwindcss()] as unknown as VitePlugins

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: {
      // We handle the default-locale prefix ourselves via `/[lang]/...` routes,
      // so keep Astro from injecting its own redirect logic.
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: vitePlugins,
  },
})
