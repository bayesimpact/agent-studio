import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameChatMessageToAgentMessage1770500000000 implements MigrationInterface {
  name = "RenameChatMessageToAgentMessage1770500000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f"`,
    )

    // Drop the index on session_id and created_at
    await queryRunner.query(`DROP INDEX "public"."IDX_ff2d3262844ff8e5a5e8842e14"`)

    // Rename the table
    await queryRunner.query(`ALTER TABLE "chat_message" RENAME TO "agent_message"`)

    // Recreate the index on the new table
    await queryRunner.query(
      `CREATE INDEX "IDX_ff2d3262844ff8e5a5e8842e14" ON "agent_message" ("session_id", "created_at")`,
    )

    // Recreate the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f"`,
    )

    // Drop the index
    await queryRunner.query(`DROP INDEX "public"."IDX_ff2d3262844ff8e5a5e8842e14"`)

    // Rename the table back
    await queryRunner.query(`ALTER TABLE "agent_message" RENAME TO "chat_message"`)

    // Recreate the index on the old table
    await queryRunner.query(
      `CREATE INDEX "IDX_ff2d3262844ff8e5a5e8842e14" ON "chat_message" ("session_id", "created_at")`,
    )

    // Recreate the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }
}
