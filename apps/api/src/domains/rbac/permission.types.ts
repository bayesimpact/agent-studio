export type PermissionResourceType = "organization" | "project" | "agent"

export type PermissionResource = {
  type: PermissionResourceType
  id: string
}

export type RoleGrant = {
  key: string
  name: string
  permissions: string[]
}
