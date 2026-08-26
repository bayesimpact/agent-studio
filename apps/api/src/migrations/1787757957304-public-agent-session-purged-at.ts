import type { MigrationInterface, QueryRunner } from "typeorm"

export class PublicAgentSessionPurgedAt1787757957304 implements MigrationInterface {
  name = "PublicAgentSessionPurgedAt1787757957304"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public_agent_session" ADD "purged_at" TIMESTAMP`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public_agent_session" DROP COLUMN "purged_at"`)
  }
}
