import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateChatMessageTableAndRemoveMessagesColumn1769786372974
  implements MigrationInterface
{
  name = "CreateChatMessageTableAndRemoveMessagesColumn1769786372974"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "status" character varying, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "tool_calls" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_ff2d3262844ff8e5a5e8842e14" ON "chat_message" ("session_id", "created_at") `,
    )
    await queryRunner.query(`ALTER TABLE "chat_session" DROP COLUMN "messages"`)
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f" FOREIGN KEY ("session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_c296b04bfe576bed3d1da68d15f"`,
    )
    await queryRunner.query(`ALTER TABLE "chat_session" ADD "messages" jsonb NOT NULL`)
    await queryRunner.query(`DROP INDEX "public"."IDX_ff2d3262844ff8e5a5e8842e14"`)
    await queryRunner.query(`DROP TABLE "chat_message"`)
  }
}
