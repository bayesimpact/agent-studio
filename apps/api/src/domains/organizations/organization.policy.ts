import type { User } from "@/domains/users/user.entity"

const ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN = "@bayesimpact.org"

export class OrganizationPolicy {
  constructor(private readonly user: User) {}

  canCreate(): boolean {
    const normalizedEmail = this.user.email.trim().toLowerCase()
    console.log(
      `❤️‍🩹 ❤️‍🩹 ❤️‍🩹 normalizedEmail: ${normalizedEmail}`,
      `ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN: ${ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN}`,
    )
    return normalizedEmail.endsWith(ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN)
  }
}
