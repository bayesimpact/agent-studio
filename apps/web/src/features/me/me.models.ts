import type { Organization } from "../organizations/organizations.models"

export type User = {
  id: string
  email: string
  name: string
  admin?: boolean
}

export type Me = {
  user: User
  organizations: Organization[]
}
