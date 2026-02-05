import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddUpdatedAt1770728948848 implements MigrationInterface {
  name = "AddUpdatedAt1770728948848"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_message" DROP COLUMN "updated_at"`)
  }
}
