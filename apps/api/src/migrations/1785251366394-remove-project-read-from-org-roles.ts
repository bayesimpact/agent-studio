import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Removes the `project.read` grant from the org_owner and org_admin roles.
 *
 * Org roles must not convey project visibility: with `project.read` on org
 * roles, PermissionService inheritance made every project of the org visible
 * to org owners/admins in listings, while the project policies (which require
 * a direct project membership) rejected them with a 403 on access.
 * Project visibility is governed by project memberships only.
 */
export class RemoveProjectReadFromOrgRoles1785251366394 implements MigrationInterface {
  name = "RemoveProjectReadFromOrgRoles1785251366394"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key IN ('org_owner', 'org_admin')
        AND role_permission.permission_key = 'project.read'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'project.read'
      FROM "role" AS role
      WHERE role.key IN ('org_owner', 'org_admin')
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)
  }
}
