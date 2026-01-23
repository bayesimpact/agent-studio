import type { ApiRoute } from "@caseai-connect/api-contracts"
import { apiRequest } from "@/store/apiClient"
import { Auth0AuthenticationError, getAccessToken, logoutAuth0 } from "./auth0Client"

type Params<T extends ApiRoute> = {
  route: T
  payload?: T["request"]
  pathParams?: Record<string, string>
}

/**
 * Enhanced API client that automatically retrieves and includes Auth0 access token
 * in each request. Uses getTokenSilently to ensure tokens are always fresh and valid.
 *
 * When an Auth0 authentication error occurs (e.g., invalid_grant, login_required),
 * this function automatically logs out the user and redirects them to re-authenticate.
 */
export async function apiRequestWithAuth<T extends ApiRoute>({
  route,
  payload,
  pathParams,
}: Params<T>): Promise<T["response"]> {
  try {
    const token = await getAccessToken()
    return apiRequest({ route, payload, token, pathParams })
  } catch (error) {
    // Handle Auth0 authentication errors that require re-authentication
    if (error instanceof Auth0AuthenticationError) {
      console.warn(
        `Auth0 authentication error (${error.errorCode}): ${error.message}. Logging out user.`,
      )
      // Logout will redirect the user, so we don't need to throw here
      // The logout will clear localStorage and redirect to home page
      await logoutAuth0()
      // Throw a user-friendly error that won't cause infinite loops
      throw new Error("Your session has expired. Please log in again.")
    }

    // Handle other token retrieval errors
    console.error("Failed to get access token:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to get access token: ${error.message}`)
    }
    throw error
  }
}
