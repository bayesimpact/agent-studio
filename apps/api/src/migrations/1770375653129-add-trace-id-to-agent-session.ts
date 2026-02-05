import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddTraceIdToAgentSession1770375653129 implements MigrationInterface {
  name = "AddTraceIdToAgentSession1770375653129"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_session" ADD "trace_id" uuid`)

    await queryRunner.query(`
      UPDATE "agent_session"
      SET "trace_id" = "id"
    `)
    await queryRunner.query(`
      ALTER TABLE "agent_session"
      ALTER COLUMN "trace_id" SET NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_session" DROP COLUMN "trace_id"`)
  }
}
