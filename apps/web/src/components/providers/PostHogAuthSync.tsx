import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { isPosthogEnabled, posthog } from "../../external/posthog.ts"

export function PostHogAuthSync() {
  const { isAuthenticated, user } = useAuth0()

  useEffect(() => {
    if (!isPosthogEnabled) {
      return
    }

    if (isAuthenticated && user?.sub) {
      posthog.identify(user.sub, {
        email: user.email,
        name: user.name,
      })

      return
    }

    if (!isAuthenticated) {
      posthog.reset()
    }
  }, [isAuthenticated, user?.email, user?.name, user?.sub])

  return null
}
