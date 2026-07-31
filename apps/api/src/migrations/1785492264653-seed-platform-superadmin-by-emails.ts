import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Assigns `platform_superadmin` to users listed in BACKOFFICE_AUTHORIZED_EMAILS.
 *
 * The role was created by `PlatformRolesAndPermissions1785320282681` without
 * seeding memberships; this migration backfills the former email-allowlist
 * super-admins. Idempotent: skips users who already hold the role.
 */
export class SeedPlatformSuperadminByEmails1785492264653 implements MigrationInterface {
  name = "SeedPlatformSuperadminByEmails1785492264653"

  public async up(queryRunner: QueryRunner): Promise<void> {
    const authorizedEmailsRaw = process.env.BACKOFFICE_AUTHORIZED_EMAILS?.trim()
    const authorizedEmails = (authorizedEmailsRaw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)

    if (authorizedEmails.length === 0) {
      // CI sets CI=true; test migrations should run with NODE_ENV=test
      if (process.env.CI === "true" || process.env.NODE_ENV === "test") {
        return
      }

      throw new Error(
        "BACKOFFICE_AUTHORIZED_EMAILS must be set to run this migration: " +
          "it assigns the platform_superadmin role to those users " +
          "(comma-separated emails of former backoffice super-admins)",
      )
    }

    await queryRunner.query(
      `
      INSERT INTO "user_membership" ("user_id", "resource_type", "resource_id", "role", "role_id")
      SELECT user_account.id, 'global', NULL, 'member', role.id
      FROM "user" AS user_account
      CROSS JOIN "role" AS role
      WHERE role.key = 'platform_superadmin'
        AND lower(trim(user_account.email)) = ANY($1::text[])
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
      [authorizedEmails],
    )
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
