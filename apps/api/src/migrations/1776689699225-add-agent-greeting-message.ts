import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddAgentGreetingMessage1776689699225 implements MigrationInterface {
  name = "AddAgentGreetingMessage1776689699225"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" ADD "greeting_message" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "greeting_message"`)
  }
}
