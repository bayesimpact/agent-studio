import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameAppPrivateIntoLive1772483259888 implements MigrationInterface {
  name = "RenameAppPrivateIntoLive1772483259888"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "conversation_agent_session" SET "type" = 'live' WHERE "type" = 'app-private'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "conversation_agent_session" SET "type" = 'app-private' WHERE "type" = 'live'`,
    )
  }
}
