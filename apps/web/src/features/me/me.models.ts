import type { Organization } from "../organizations/organizations.slice"

export type User = {
  id: string
  email: string
  name: string | null
}

export type Me = {
  user: User
  organizations: Organization[]
}
