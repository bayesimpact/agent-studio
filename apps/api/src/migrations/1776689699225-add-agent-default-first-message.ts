import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddAgentDefaultFirstMessage1776689699225 implements MigrationInterface {
  name = "AddAgentDefaultFirstMessage1776689699225"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" ADD "default_first_message" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "default_first_message"`)
  }
}
