import type { User } from "@/domains/users/user.entity"

const ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN = "@bayesimpact.org"

export class OrganizationPolicy {
  constructor(private readonly user: User) {}

  canCreate(): boolean {
    const normalizedEmail = this.user.email.trim().toLowerCase()
    return normalizedEmail.endsWith(ALLOWED_ORGANIZATION_CREATOR_EMAIL_DOMAIN)
  }
}
