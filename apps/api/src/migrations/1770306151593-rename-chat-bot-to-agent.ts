import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameChatBotToAgent1770306151593 implements MigrationInterface {
  name = "RenameChatBotToAgent1770306151593"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753"`,
    )

    // Rename the old table to the new table name
    await queryRunner.query(`ALTER TABLE "chat_bot" RENAME TO "agent"`)

    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753" FOREIGN KEY ("chat_bot_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753"`)

    // Rename the old table to the new table name
    await queryRunner.query(`ALTER TABLE "agent" RENAME TO "chat_bot"`)

    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753" FOREIGN KEY ("chat_bot_id") REFERENCES "chat_bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
