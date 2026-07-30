export const ORGANIZATION_CREATE_PERMISSION = "organization.create" as const

export const TRACE_READ_PERMISSION = "trace.read" as const

export const BACKOFFICE_READ_PERMISSION = "backoffice.read" as const

/** Backoffice "list all" permissions: read every resource of a type on the platform. */
export const BACKOFFICE_ORGANIZATION_READ_PERMISSION = "backoffice.organization.read" as const

export const BACKOFFICE_PROJECT_READ_PERMISSION = "backoffice.project.read" as const

export const BACKOFFICE_AGENT_READ_PERMISSION = "backoffice.agent.read" as const

export const BACKOFFICE_USER_READ_PERMISSION = "backoffice.user.read" as const

export const TERMS_UPDATE_PERMISSION = "terms.update" as const

export const PROJECT_CREATE_PERMISSION = "project.create" as const

export const PROJECT_READ_PERMISSION = "project.read" as const

/** See the users who are members of a resource you hold this permission on. */
export const USER_READ_PERMISSION = "user.read" as const

/** Org-scoped permissions: checked against an organization membership. */
export const ORGANIZATION_SCOPED_PERMISSIONS = [
  "organization.read",
  "organization.update",
  "organization.delete",
  PROJECT_CREATE_PERMISSION,
  PROJECT_READ_PERMISSION,
  USER_READ_PERMISSION,
  BACKOFFICE_ORGANIZATION_READ_PERMISSION,
] as const

export type OrganizationScopedPermission = (typeof ORGANIZATION_SCOPED_PERMISSIONS)[number]

export type GlobalPermission =
  | typeof ORGANIZATION_CREATE_PERMISSION
  | typeof TRACE_READ_PERMISSION
  | typeof BACKOFFICE_READ_PERMISSION
  | typeof BACKOFFICE_ORGANIZATION_READ_PERMISSION
  | typeof BACKOFFICE_PROJECT_READ_PERMISSION
  | typeof BACKOFFICE_AGENT_READ_PERMISSION
  | typeof BACKOFFICE_USER_READ_PERMISSION
  | typeof TERMS_UPDATE_PERMISSION

export type OrganizationPermission = OrganizationScopedPermission
