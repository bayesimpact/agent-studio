export const ORGANIZATION_CREATE_PERMISSION = "organization.create" as const

export const TRACE_VIEW_PERMISSION = "trace.view" as const

export const PROJECT_CREATE_PERMISSION = "project.create" as const

export const PROJECT_READ_PERMISSION = "project.read" as const

/** Org-scoped permissions: checked against an organization membership. */
export const ORGANIZATION_SCOPED_PERMISSIONS = [
  "organization.read",
  "organization.update",
  "organization.delete",
  PROJECT_CREATE_PERMISSION,
  PROJECT_READ_PERMISSION,
] as const

export type OrganizationScopedPermission = (typeof ORGANIZATION_SCOPED_PERMISSIONS)[number]

export type GlobalPermission = typeof ORGANIZATION_CREATE_PERMISSION | typeof TRACE_VIEW_PERMISSION

export type OrganizationPermission = OrganizationScopedPermission
