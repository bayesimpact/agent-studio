import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddPriorityCallsEnabledToAgentSettings1787739589696 implements MigrationInterface {
  name = "AddPriorityCallsEnabledToAgentSettings1787739589696"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_settings" ADD "priority_calls_enabled" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_settings" DROP COLUMN "priority_calls_enabled"`)
  }
}
