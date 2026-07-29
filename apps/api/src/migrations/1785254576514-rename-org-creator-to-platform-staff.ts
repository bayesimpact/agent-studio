import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Renames the global `org_creator` role to `platform_staff` and grants it
 * `trace.view` in addition to its existing `organization.create` permission.
 *
 * The rename (rather than create + drop) preserves the existing
 * `role_permission` rows and the global `user_membership` grants that
 * reference the role by id.
 */
export class RenameOrgCreatorToPlatformStaff1785254576514 implements MigrationInterface {
  name = "RenameOrgCreatorToPlatformStaff1785254576514"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "role"
      SET "key" = 'platform_staff', "name" = 'Platform Staff'
      WHERE "key" = 'org_creator'
    `)

    await queryRunner.query(`
      INSERT INTO "role_permission" ("role_id", "permission_key")
      SELECT role.id, 'trace.view'
      FROM "role" AS role
      WHERE role.key = 'platform_staff'
      ON CONFLICT ("role_id", "permission_key") DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permission" AS role_permission
      USING "role" AS role
      WHERE role_permission.role_id = role.id
        AND role.key = 'platform_staff'
        AND role_permission.permission_key = 'trace.view'
    `)

    await queryRunner.query(`
      UPDATE "role"
      SET "key" = 'org_creator', "name" = 'Organization Creator'
      WHERE "key" = 'platform_staff'
    `)
  }
}
