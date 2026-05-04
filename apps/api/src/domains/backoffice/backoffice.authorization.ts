export function getBackofficeAuthorizedEmails(): string[] {
  const raw = process.env.BACKOFFICE_AUTHORIZED_EMAILS
  if (!raw) return []
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

export function isEmailBackofficeAuthorized(email: string | null | undefined): boolean {
  if (!email) return false
  const authorizedEmails = getBackofficeAuthorizedEmails()
  if (authorizedEmails.length === 0) return false
  return authorizedEmails.includes(email.trim().toLowerCase())
}

export function isDomainBackofficeAuthorized(email: string | null | undefined): boolean {
  if (!email) return false
  const authorizedDomain = process.env.BACKOFFICE_AUTHORIZED_DOMAIN
  if (!authorizedDomain) return false
  return email.endsWith(authorizedDomain)
}
