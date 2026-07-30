import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Replaces the last env-based authorization checks with RBAC:
 * - renames `trace.view` to `trace.read` (CRUD-verb catalog)
 * - platform_staff: grants `backoffice.read` + `terms.update`,
 *   revokes `organization.create` (moves to the superadmin role)
 * - creates the global `platform_superadmin` role granting
 *   `backoffice.read`, `trace.read`, `terms.update`, `organization.create`
 *   and the backoffice "list all" permissions
 *   `backoffice.{organization,project,agent,user}.read`
 *   (ex BACKOFFICE_AUTHORIZED_EMAILS)
 * - grants `user.read` to org/project/agent owner+admin roles
 * - grants `backoffice.organization.read` to org owner+admin roles
 * - grants `backoffice.project.read` to org and project owner+admin roles
 * - grants `backoffice.agent.read` to org, project, and agent owner+admin roles
 * - seeds agent RBAC roles (`agent_owner` / `agent_admin` / `agent_member`)
 *   and backfills `role_id` on agent memberships
 *   (scoped backoffice listings without a global grant)
 * - assigns platform_staff to users whose email matches
 *   ORGANIZATION_CREATOR_EMAIL_DOMAIN (throws if the env var is missing:
 *   the earlier seed migration skipped silently and never ran in production)
 *
 * platform_superadmin memberships are not seeded: assigned manually.
 */
export class PlatformRolesAndPermissions1785320282681 implements MigrationInterface {
  name = "PlatformRolesAndPermissions1785320282681"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "role_permission"
      SET "permission_key" = 'trace.read'
      WHERE "permission_key" = 'trace.view'
    `)

    await queryRunner.query(`
      INSERT INTO "role" ("key", "name", "scope_type")
      SELECT 'platform_superadmin', 'Platform Superadmin', 'global'
      WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE "key" = 'platform_superadmin')
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, permission.key
      FROM "role" AS role
      CROSS JOIN (VALUES ('backoffice.read'), ('terms.update')) AS permission(key)
      WHERE role.key = 'platform_staff'
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key = 'platform_staff'
        AND role_permission.permission_key = 'organization.create'
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, permission.key
      FROM "role" AS role
      CROSS JOIN (
        VALUES
          ('backoffice.read'),
          ('trace.read'),
          ('terms.update'),
          ('backoffice.organization.read'),
          ('backoffice.project.read'),
          ('backoffice.agent.read'),
          ('backoffice.user.read'),
          ('organization.create')
      ) AS permission(key)
      WHERE role.key = 'platform_superadmin'
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'user.read'
      FROM "role" AS role
      WHERE role.key IN ('org_owner', 'org_admin', 'project_owner', 'project_admin')
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'backoffice.organization.read'
      FROM "role" AS role
      WHERE role.key IN ('org_owner', 'org_admin')
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'backoffice.project.read'
      FROM "role" AS role
      WHERE role.key IN ('org_owner', 'org_admin', 'project_owner', 'project_admin')
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role" ("key", "name", "scope_type")
      VALUES
        ('agent_owner', 'Agent Owner', 'agent'),
        ('agent_admin', 'Agent Admin', 'agent'),
        ('agent_member', 'Agent Member', 'agent')
      ON CONFLICT ("key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, permission.permission_key
      FROM "role" AS role
      INNER JOIN (
        VALUES
          ('agent_owner', 'agent.read'),
          ('agent_owner', 'agent.update'),
          ('agent_owner', 'agent.delete'),
          ('agent_owner', 'user.read'),
          ('agent_owner', 'backoffice.agent.read'),
          ('agent_admin', 'agent.read'),
          ('agent_admin', 'agent.update'),
          ('agent_admin', 'agent.delete'),
          ('agent_admin', 'user.read'),
          ('agent_admin', 'backoffice.agent.read'),
          ('agent_member', 'agent.read')
      ) AS permission(role_key, permission_key)
        ON role.key = permission.role_key
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'backoffice.agent.read'
      FROM "role" AS role
      WHERE role.key IN (
        'org_owner', 'org_admin',
        'project_owner', 'project_admin'
      )
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      UPDATE "user_membership" AS membership
      SET role_id = role.id
      FROM "role" AS role
      WHERE membership.resource_type = 'agent'
        AND membership.role_id IS NULL
        AND membership.role = 'owner'
        AND role.key = 'agent_owner'
    `)
    await queryRunner.query(`
      UPDATE "user_membership" AS membership
      SET role_id = role.id
      FROM "role" AS role
      WHERE membership.resource_type = 'agent'
        AND membership.role_id IS NULL
        AND membership.role = 'admin'
        AND role.key = 'agent_admin'
    `)
    await queryRunner.query(`
      UPDATE "user_membership" AS membership
      SET role_id = role.id
      FROM "role" AS role
      WHERE membership.resource_type = 'agent'
        AND membership.role_id IS NULL
        AND membership.role = 'member'
        AND role.key = 'agent_member'
    `)

    const allowedDomain = process.env.ORGANIZATION_CREATOR_EMAIL_DOMAIN?.trim()
    if (!allowedDomain) {
      throw new Error(
        "ORGANIZATION_CREATOR_EMAIL_DOMAIN must be set to run this migration: " +
          "it assigns the platform_staff role to users whose email matches this domain",
      )
    }

    await queryRunner.query(
      `
      INSERT INTO "user_membership" ("user_id", "resource_type", "resource_id", "role", "role_id")
      SELECT user_account.id, 'global', NULL, 'member', role.id
      FROM "user" AS user_account
      CROSS JOIN "role" AS role
      WHERE role.key = 'platform_staff'
        AND lower(trim(user_account.email)) LIKE '%' || lower(trim($1))
        AND user_account.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "user_membership" AS membership
          WHERE membership.user_id = user_account.id
            AND membership.resource_type = 'global'
            AND membership.role_id = role.id
            AND membership.deleted_at IS NULL
        )
      `,
      [allowedDomain],
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_membership" AS membership
      USING "role" AS role
      WHERE membership.resource_type = 'global'
        AND membership.role_id = role.id
        AND role.key = 'platform_staff'
    `)

    await queryRunner.query(`
      UPDATE "user_membership" AS membership
      SET role_id = NULL
      FROM "role" AS role
      WHERE membership.role_id = role.id
        AND role.key IN ('agent_owner', 'agent_admin', 'agent_member')
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN ('agent_owner', 'agent_admin', 'agent_member')
    `)

    await queryRunner.query(`
      DELETE FROM "role"
      WHERE key IN ('agent_owner', 'agent_admin', 'agent_member')
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN (
          'org_owner', 'org_admin',
          'project_owner', 'project_admin'
        )
        AND role_permission.permission_key = 'backoffice.agent.read'
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN ('org_owner', 'org_admin', 'project_owner', 'project_admin')
        AND role_permission.permission_key = 'backoffice.project.read'
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN ('org_owner', 'org_admin')
        AND role_permission.permission_key = 'backoffice.organization.read'
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN ('org_owner', 'org_admin', 'project_owner', 'project_admin')
        AND role_permission.permission_key = 'user.read'
    `)

    await queryRunner.query(`
      DELETE FROM "user_membership" AS membership
      USING "role" AS role
      WHERE membership.role_id = role.id
        AND role.key = 'platform_superadmin'
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key = 'platform_superadmin'
    `)

    await queryRunner.query(`DELETE FROM "role" WHERE "key" = 'platform_superadmin'`)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'organization.create'
      FROM "role" AS role
      WHERE role.key = 'platform_staff'
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)

    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key = 'platform_staff'
        AND role_permission.permission_key IN ('backoffice.read', 'terms.update')
    `)

    await queryRunner.query(`
      UPDATE "role_permission"
      SET "permission_key" = 'trace.view'
      WHERE "permission_key" = 'trace.read'
    `)
  }
}
