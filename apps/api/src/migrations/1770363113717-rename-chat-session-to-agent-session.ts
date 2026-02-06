import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameChatSessionToAgentSession1770363113717 implements MigrationInterface {
  name = "RenameChatSessionToAgentSession1770363113717"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_fce129237683d8a3c3c8d9a293"`)

    // Rename the old table to the new table name
    await queryRunner.query(`ALTER TABLE "chat_session" RENAME TO "agent_session"`)

    // change column name
    await queryRunner.query(`ALTER TABLE "agent_session" RENAME COLUMN "chat_bot_id" TO "agent_id"`)

    await queryRunner.query(
      `CREATE INDEX "IDX_e581f8875b2c8bad9ca4dc697a" ON "agent_session" ("agent_id", "type") `,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_e581f8875b2c8bad9ca4dc697a"`)
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f"`,
    )

    // Rename the new table to the old table name
    await queryRunner.query(`ALTER TABLE "agent_session" RENAME TO "chat_session"`)

    // change column name
    await queryRunner.query(`ALTER TABLE "chat_session" RENAME COLUMN "agent_id" TO "chat_bot_id"`)

    await queryRunner.query(
      `CREATE INDEX "IDX_e581f8875b2c8bad9ca4dc697a" ON "agent_session" ("chat_bot_id", "type") `,
    )

    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f" FOREIGN KEY ("session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }
}
