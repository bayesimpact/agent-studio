import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddDeletedAt1770728948849 implements MigrationInterface {
  name = "AddDeletedAt1770728948849"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_membership" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "organization" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "project" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "agent_message" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "agent_session" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "user" ADD "deleted_at" TIMESTAMP`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`ALTER TABLE "agent_session" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`ALTER TABLE "agent_message" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`ALTER TABLE "user_membership" DROP COLUMN "deleted_at"`)
  }
}
