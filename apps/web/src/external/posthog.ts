import posthog from "posthog-js"

const posthogApiKey =
  (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined)
const posthogHost =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://us.i.posthog.com"

export const isPosthogEnabled = Boolean(posthogApiKey)

if (posthogApiKey) {
  posthog.init(posthogApiKey, {
    api_host: posthogHost,
    autocapture: false,
    defaults: "2025-05-24",
  })
}

export { posthog }
