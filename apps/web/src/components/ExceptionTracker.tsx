import type posthogJs from "posthog-js"
import { PostHogProvider } from "posthog-js/react"

export function ExceptionTracker({
  children,
  client,
}: {
  children: React.ReactNode
  client?: typeof posthogJs
}) {
  return client ? <PostHogProvider client={client}>{children}</PostHogProvider> : children
}
