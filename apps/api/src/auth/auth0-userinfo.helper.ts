/**
 * Normalizes the user name from Auth0.
 * If the name is the same as the email, extracts the part before "@" to get a better name.
 * @param name - The user's name from Auth0
 * @param email - The user's email from Auth0
 * @returns The normalized name, or the original name if it's different from email
 */
export function normalizeAuth0Name(
  name: string | undefined,
  email: string | undefined,
): string | undefined {
  if (!name || !email) {
    return name
  }

  // If name is the same as email, extract the part before "@"
  if (name === email) {
    const localPart = email.split("@")[0]
    return localPart
  }

  return name
}
