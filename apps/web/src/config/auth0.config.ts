/**
 * Auth0 organization ID from environment variables.
 * Used for all loginWithRedirect calls.
 */
export const AUTH0_ORGANIZATION_ID = import.meta.env.VITE_AUTH0_ORGANIZATION_ID as string

/**
 * Shared Auth0 configuration used by both Auth0Provider and Auth0 client instances.
 * This ensures a single source of truth for Auth0 settings.
 */
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN as string,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID as string,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE as string,
    scope: "openid profile email offline_access",
  },
  useRefreshTokens: true,
  cacheLocation: "localstorage" as const,
}

/**
 * Configuration for Auth0Provider component (React SDK)
 * This matches the props expected by @auth0/auth0-react Auth0Provider
 */
export const auth0ProviderConfig = auth0Config

/**
 * Configuration for Auth0Client (SPA JS SDK)
 * This can be used with createAuth0Client from @auth0/auth0-spa-js
 * Note: Some property names may differ between React SDK and SPA JS SDK
 */
export const auth0ClientConfig = {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  authorizationParams: auth0Config.authorizationParams,
  useRefreshTokens: auth0Config.useRefreshTokens,
  cacheLocation: auth0Config.cacheLocation,
}
