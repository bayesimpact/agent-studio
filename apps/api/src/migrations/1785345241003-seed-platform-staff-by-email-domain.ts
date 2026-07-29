import type { MigrationInterface, QueryRunner } from "typeorm"

export class SeedPlatformStaffByEmailDomain1785345241003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
