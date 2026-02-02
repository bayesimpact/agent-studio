import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameChatbotIdToChatBotId1770016243383 implements MigrationInterface {
  name = "RenameChatbotIdToChatBotId1770016243383"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_34803e4793d13b973f012952dfe"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_9806343d1fcbc822f8c2750b54"`)
    await queryRunner.query(
      `ALTER TABLE "chat_session" RENAME COLUMN "chatbot_id" TO "chat_bot_id"`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_fce129237683d8a3c3c8d9a293" ON "chat_session" ("chat_bot_id", "type") `,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753" FOREIGN KEY ("chat_bot_id") REFERENCES "chat_bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_fce129237683d8a3c3c8d9a293"`)
    await queryRunner.query(
      `ALTER TABLE "chat_session" RENAME COLUMN "chat_bot_id" TO "chatbot_id"`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9806343d1fcbc822f8c2750b54" ON "chat_session" ("chatbot_id", "type") `,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_34803e4793d13b973f012952dfe" FOREIGN KEY ("chatbot_id") REFERENCES "chat_bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
