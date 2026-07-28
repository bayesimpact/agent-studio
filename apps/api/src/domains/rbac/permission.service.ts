import { Injectable } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
import type { PermissionResource, PermissionResourceType } from "./permission.types"
import {
  PARENT_RESOURCE_TYPE_MAP,
  RESOURCE_TYPE_PERMISSIONS_MAP,
  RESOURCE_TYPE_READ_PERMISSION_MAP,
} from "./rbac.constants"

type PermissionRow = { permissionKey: string }
type ResourcePermissionRow = { resourceId: string; permissionKey: string }
type ResourceIdRow = { resourceId: string }
type ChildResourceRow = { resourceId: string; parentResourceId: string }

@Injectable()
export class PermissionService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async listGlobalPermissions(userId: string): Promise<string[]> {
    const rows: PermissionRow[] = await this.dataSource.query(
      `SELECT DISTINCT role_permission.permission_key AS "permissionKey"
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = 'global'
         AND membership.resource_id IS NULL
         AND membership.role_id IS NOT NULL
         AND membership.deleted_at IS NULL`,
      [userId],
    )

    return rows.map((row) => row.permissionKey)
  }

  /** Permission keys granted by a single role, straight from the RBAC catalog. */
  async listPermissionsForRole(roleId: string): Promise<string[]> {
    const rows: PermissionRow[] = await this.dataSource.query(
      `SELECT role_permission.permission_key AS "permissionKey"
       FROM role_permission
       WHERE role_permission.role_id = $1
       ORDER BY role_permission.permission_key`,
      [roleId],
    )

    return rows.map((row) => row.permissionKey)
  }

  /**
   * Returns all resource ids that the user has access to, including:
   * - direct access (easy)
   * - access through parent resources (slightly harder)
   *
   * WARNING: this does not return the permissions for the resources, only the ids.
   * To get the permissions, use listResourcePermissions instead.
   */
  async listResourceIds(userId: string, resourceType: PermissionResourceType): Promise<string[]> {
    // the goal is to retrieve all resource ids that the user has access to, including:
    // - direct access (easy)
    // - access through parent resources (slightly harder)

    const directResourceIds = await this.listResourceIdsFromDirectAccess(userId, resourceType)
    const resourceIdsFromParents: string[] = []

    // every parent resource type contributes: a user can inherit access through
    // several sources at once (e.g. an org role AND a project role for agents),
    // so the loop accumulates instead of stopping at the first match
    for (const parentResourceType of PARENT_RESOURCE_TYPE_MAP[resourceType]) {
      // parent resources qualify when their role grants the read permission
      // for the requested resource type
      const parentResourceIds = await this.listResourceIdsMatchingPermission(
        userId,
        parentResourceType,
        RESOURCE_TYPE_READ_PERMISSION_MAP[resourceType],
      )
      if (parentResourceIds.length === 0) continue

      const childRows = await this.fetchChildResourceRows(
        resourceType,
        parentResourceType,
        parentResourceIds,
      )
      resourceIdsFromParents.push(...childRows.map((row) => row.resourceId))
    }

    return [...new Set([...directResourceIds, ...resourceIdsFromParents])]
  }

  /**
   * Same as listResourceIds, but returns the effective permissions per resource id:
   * - direct access: the permissions of the role held on the resource itself
   * - access through a parent resource: the parent's permissions, filtered down to the
   *   ones that apply to the requested resource type (RESOURCE_TYPE_PERMISSIONS_MAP)
   */
  async listResourcePermissions(
    userId: string,
    resourceType: PermissionResourceType,
  ): Promise<Map<string, string[]>> {
    const permissionsByResourceId = await this.listDirectResourcePermissions(userId, resourceType)
    // permissions that apply to the requested resource type (e.g. project -> project.*)
    const resourceTypePermissions: readonly string[] = RESOURCE_TYPE_PERMISSIONS_MAP[resourceType]

    // every parent resource type contributes: a user can inherit access through
    // several sources at once (e.g. an org role AND a project role for agents),
    // so the loop accumulates instead of stopping at the first match
    for (const parentResourceType of PARENT_RESOURCE_TYPE_MAP[resourceType]) {
      // parent resources qualify when their role grants the read permission
      // for the requested resource type (the full permission set is then conveyed)
      const parentPermissionsByParentId =
        await this.listDirectResourcePermissionsMatchingPermission(
          userId,
          parentResourceType,
          RESOURCE_TYPE_READ_PERMISSION_MAP[resourceType],
        )
      if (parentPermissionsByParentId.size === 0) continue

      const childResourceRows = await this.fetchChildResourceRows(
        resourceType,
        parentResourceType,
        Array.from(parentPermissionsByParentId.keys()),
      )

      for (const { resourceId, parentResourceId } of childResourceRows) {
        // intersection: only keep the parent's permissions that apply to the requested resource type
        const inheritedPermissions = (
          parentPermissionsByParentId.get(parentResourceId) ?? []
        ).filter((permission) => resourceTypePermissions.includes(permission))

        // union: inherited permissions add to (never replace) already collected ones
        const collectedPermissions = permissionsByResourceId.get(resourceId) ?? []
        permissionsByResourceId.set(resourceId, [
          ...new Set([...collectedPermissions, ...inheritedPermissions]),
        ])
      }
    }

    return permissionsByResourceId
  }

  /** Permissions granted by roles held directly on resources of the given type. */
  private async listDirectResourcePermissions(
    userId: string,
    resourceType: PermissionResourceType,
  ): Promise<Map<string, string[]>> {
    const rows: ResourcePermissionRow[] = await this.dataSource.query(
      `SELECT membership.resource_id AS "resourceId",
              role_permission.permission_key AS "permissionKey"
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = $2
         AND membership.resource_id IS NOT NULL
         AND membership.deleted_at IS NULL`,
      [userId, resourceType],
    )

    return this.groupPermissionsByResourceId(rows)
  }

  /**
   * All permissions granted by roles held directly on resources of the given type,
   * restricted to the resources whose role also grants the given permission.
   * (the permission gates WHICH resources qualify; the full permission set is returned)
   */
  private async listDirectResourcePermissionsMatchingPermission(
    userId: string,
    resourceType: PermissionResourceType,
    permission: string,
  ): Promise<Map<string, string[]>> {
    const rows: ResourcePermissionRow[] = await this.dataSource.query(
      `SELECT membership.resource_id AS "resourceId",
              role_permission.permission_key AS "permissionKey"
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = $2
         AND membership.resource_id IS NOT NULL
         AND membership.deleted_at IS NULL
         AND EXISTS (
           SELECT 1
           FROM role_permission required_permission
           WHERE required_permission.role_id = membership.role_id
             AND required_permission.permission_key = $3
         )`,
      [userId, resourceType, permission],
    )

    return this.groupPermissionsByResourceId(rows)
  }

  private async listResourceIdsFromDirectAccess(
    userId: string,
    resourceType: PermissionResourceType,
  ): Promise<string[]> {
    const readPermission = RESOURCE_TYPE_READ_PERMISSION_MAP[resourceType]

    if (!readPermission) {
      return []
    }

    return this.listResourceIdsMatchingPermission(userId, resourceType, readPermission)
  }

  private async listResourceIdsMatchingPermission(
    userId: string,
    resourceType: PermissionResourceType,
    readPermission: string,
  ): Promise<string[]> {
    const rows: ResourceIdRow[] = await this.dataSource.query(
      `SELECT DISTINCT membership.resource_id AS "resourceId"
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = $2
         AND membership.resource_id IS NOT NULL
         AND membership.deleted_at IS NULL
         AND role_permission.permission_key = $3`,
      [userId, resourceType, readPermission],
    )
    return rows.map((row) => row.resourceId)
  }

  async hasGlobal(userId: string, permission: string): Promise<boolean> {
    const matches: { allowed: number }[] = await this.dataSource.query(
      `SELECT 1 AS allowed
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = 'global'
         AND membership.resource_id IS NULL
         AND membership.role_id IS NOT NULL
         AND membership.deleted_at IS NULL
         AND role_permission.permission_key = $2
       LIMIT 1`,
      [userId, permission],
    )

    return matches.length > 0
  }

  /**
   * Whether the user holds the permission on the resource, either through a
   * role held directly on the resource, or inherited from a role on an
   * ancestor resource (e.g. an org role granting `project.read` applies to
   * every project of the org).
   *
   * Inheritance is gated by RESOURCE_TYPE_PERMISSIONS_MAP, with the same
   * semantics as listResourcePermissions: a parent role only conveys the
   * permissions that apply to the child resource type.
   */
  async has(userId: string, permission: string, resource: PermissionResource): Promise<boolean> {
    if (await this.hasDirectly(userId, permission, resource)) {
      return true
    }

    // a permission that does not apply to this resource type can never be inherited
    const resourceTypePermissions: readonly string[] = RESOURCE_TYPE_PERMISSIONS_MAP[resource.type]
    if (!resourceTypePermissions.includes(permission)) {
      return false
    }

    for (const parentResourceType of PARENT_RESOURCE_TYPE_MAP[resource.type]) {
      const parentResourceId = await this.fetchParentResourceId(resource, parentResourceType)
      if (!parentResourceId) {
        continue
      }

      const hasPermissionOnParent = await this.hasDirectly(userId, permission, {
        type: parentResourceType,
        id: parentResourceId,
      })
      if (hasPermissionOnParent) {
        return true
      }
    }

    return false
  }

  /** Whether a role held directly on the resource grants the permission. */
  private async hasDirectly(
    userId: string,
    permission: string,
    resource: PermissionResource,
  ): Promise<boolean> {
    const matches: { allowed: number }[] = await this.dataSource.query(
      `SELECT 1 AS allowed
       FROM user_membership membership
       INNER JOIN role_permission ON role_permission.role_id = membership.role_id
       WHERE membership.user_id = $1
         AND membership.resource_type = $2
         AND membership.resource_id = $3
         AND membership.role_id IS NOT NULL
         AND membership.deleted_at IS NULL
         AND role_permission.permission_key = $4
       LIMIT 1`,
      [userId, resource.type, resource.id, permission],
    )

    return matches.length > 0
  }

  /** Resolves the id of the resource's ancestor of the given type, if any. */
  private async fetchParentResourceId(
    resource: PermissionResource,
    parentResourceType: PermissionResourceType,
  ): Promise<string | null> {
    const query = PARENT_RESOURCE_ID_QUERIES[resource.type]?.[parentResourceType]
    if (!query) {
      return null
    }

    const rows: { parentResourceId: string }[] = await this.dataSource.query(query, [resource.id])
    return rows[0]?.parentResourceId ?? null
  }

  private groupPermissionsByResourceId(rows: ResourcePermissionRow[]): Map<string, string[]> {
    const permissionsByResourceId = new Map<string, string[]>()
    for (const row of rows) {
      const resourcePermissions = permissionsByResourceId.get(row.resourceId) ?? []
      resourcePermissions.push(row.permissionKey)
      permissionsByResourceId.set(row.resourceId, resourcePermissions)
    }

    return permissionsByResourceId
  }

  /**
   * Expands parent resource ids into their child resource rows,
   * e.g. all projects (resourceId) of the given organizations (parentResourceId).
   */
  private async fetchChildResourceRows(
    resourceType: PermissionResourceType,
    parentResourceType: PermissionResourceType,
    parentResourceIds: string[],
  ): Promise<ChildResourceRow[]> {
    const query = CHILD_RESOURCE_ROWS_QUERIES[resourceType]?.[parentResourceType]
    if (!query) {
      return []
    }

    return this.dataSource.query(query, [parentResourceIds])
  }
}

/**
 * One declarative SQL query per (child resource type -> parent resource type) pair,
 * resolving the parent id of a single child resource ($1 = child id).
 * Mirror of CHILD_RESOURCE_ROWS_QUERIES.
 *
 * Every resource on the path (child, intermediate, parent) must be alive:
 * a soft-deleted resource never conveys permissions.
 */
const PARENT_RESOURCE_ID_QUERIES: Partial<
  Record<PermissionResourceType, Partial<Record<PermissionResourceType, string>>>
> = {
  project: {
    organization: `SELECT project.organization_id AS "parentResourceId"
                   FROM project
                   INNER JOIN organization ON organization.id = project.organization_id
                     AND organization.deleted_at IS NULL
                   WHERE project.id = $1
                     AND project.deleted_at IS NULL`,
  },
  agent: {
    organization: `SELECT agent.organization_id AS "parentResourceId"
                   FROM agent
                   INNER JOIN project ON project.id = agent.project_id
                     AND project.deleted_at IS NULL
                   INNER JOIN organization ON organization.id = agent.organization_id
                     AND organization.deleted_at IS NULL
                   WHERE agent.id = $1
                     AND agent.deleted_at IS NULL`,
    project: `SELECT agent.project_id AS "parentResourceId"
              FROM agent
              INNER JOIN project ON project.id = agent.project_id
                AND project.deleted_at IS NULL
              WHERE agent.id = $1
                AND agent.deleted_at IS NULL`,
  },
}

/**
 * One declarative SQL query per (child resource type -> parent resource type) pair.
 *
 * Every resource on the path (child, intermediate, parent) must be alive:
 * a soft-deleted resource never conveys permissions.
 */
const CHILD_RESOURCE_ROWS_QUERIES: Partial<
  Record<PermissionResourceType, Partial<Record<PermissionResourceType, string>>>
> = {
  project: {
    organization: `SELECT project.id AS "resourceId",
                          project.organization_id AS "parentResourceId"
                   FROM project
                   INNER JOIN organization ON organization.id = project.organization_id
                     AND organization.deleted_at IS NULL
                   WHERE project.organization_id = ANY($1)
                     AND project.deleted_at IS NULL`,
  },
  agent: {
    organization: `SELECT agent.id AS "resourceId",
                          agent.organization_id AS "parentResourceId"
                   FROM agent
                   INNER JOIN project ON project.id = agent.project_id
                     AND project.deleted_at IS NULL
                   INNER JOIN organization ON organization.id = agent.organization_id
                     AND organization.deleted_at IS NULL
                   WHERE agent.organization_id = ANY($1)
                     AND agent.deleted_at IS NULL`,
    project: `SELECT agent.id AS "resourceId",
                     agent.project_id AS "parentResourceId"
              FROM agent
              INNER JOIN project ON project.id = agent.project_id
                AND project.deleted_at IS NULL
              WHERE agent.project_id = ANY($1)
                AND agent.deleted_at IS NULL`,
  },
}
