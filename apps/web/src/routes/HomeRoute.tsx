import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AUTH0_ORGANIZATION_ID } from "@/config/auth0.config"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useNavigateToFirstOrganization } from "@/hooks/use-navigate-to-first-organization"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

const INVITATION_STORAGE_KEY = "pendingInvitationTicketId"

/**
 * Stores the Auth0 invitation ticket_id in localStorage so it survives the OAuth redirect.
 */
export function storePendingInvitation(ticketId: string): void {
  localStorage.setItem(INVITATION_STORAGE_KEY, ticketId)
}

/**
 * Retrieves and clears the pending invitation ticket_id from localStorage.
 */
export function consumePendingInvitation(): string | null {
  const ticketId = localStorage.getItem(INVITATION_STORAGE_KEY)
  if (ticketId) {
    localStorage.removeItem(INVITATION_STORAGE_KEY)
  }
  return ticketId
}

export function HomeRoute() {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizationsData)
  const [searchParams] = useSearchParams()
  const { navigateToFirstOrganization } = useNavigateToFirstOrganization()

  useEffect(() => {
    if (isLoading) return

    // Check for Auth0 invitation params in the URL
    const invitation = searchParams.get("invitation")
    const organization = searchParams.get("organization")

    if (invitation && organization) {
      // Store the ticket_id so we can accept the invitation after login
      storePendingInvitation(invitation)

      // Redirect to Auth0 with invitation params
      loginWithRedirect({
        authorizationParams: {
          organization,
          invitation,
        },
      })
      return
    }

    if (!ADS.isUninitialized(organizations) && !isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          organization: AUTH0_ORGANIZATION_ID,
        },
      })
      return
    }

    if (isAuthenticated) {
      navigateToFirstOrganization({
        organizations,
        onFail: () => {
          navigate(RouteNames.ONBOARDING, { replace: true })
        },
      })
    } else {
      loginWithRedirect({
        authorizationParams: {
          organization: AUTH0_ORGANIZATION_ID,
        },
      })
    }
  }, [
    navigateToFirstOrganization,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    navigate,
    organizations,
    searchParams,
  ])

  return <LoadingRoute />
}
