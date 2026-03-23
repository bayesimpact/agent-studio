import type { MigrationInterface, QueryRunner } from "typeorm"

export class OrganizationMembership1774269635228 implements MigrationInterface {
  name = "OrganizationMembership1774269635228"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_membership" RENAME TO "organization_membership"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_membership" RENAME TO "user_membership"`)
  }
}
