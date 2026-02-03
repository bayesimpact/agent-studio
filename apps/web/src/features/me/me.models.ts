import type { Organization } from "../organizations/organizations.models"

export type User = {
  id: string
  email: string
  name: string
}

export type Me = {
  user: User
  organizations: Organization[]
}
