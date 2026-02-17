import type { MigrationInterface, QueryRunner } from "typeorm"

export class IndexAgentMessageFeedback1771310054664 implements MigrationInterface {
  name = "IndexAgentMessageFeedback1771310054664"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_0eea4b0b9ad7fbc19f55fff2b7" ON "agent_message_feedback" ("organization_id", "project_id") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0eea4b0b9ad7fbc19f55fff2b7"`)
  }
}
