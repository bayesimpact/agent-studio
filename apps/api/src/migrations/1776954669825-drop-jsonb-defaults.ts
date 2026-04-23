import type { MigrationInterface, QueryRunner } from "typeorm"

export class DropJsonbDefaults1776954669825 implements MigrationInterface {
  name = "DropJsonbDefaults1776954669825"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" ALTER COLUMN "answers" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_session_feedback" ALTER COLUMN "answers" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "tester_per_session_questions" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "tester_end_of_phase_questions" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "reviewer_questions" DROP DEFAULT`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "reviewer_questions" SET DEFAULT '[]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "tester_end_of_phase_questions" SET DEFAULT '[]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ALTER COLUMN "tester_per_session_questions" SET DEFAULT '[]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_session_feedback" ALTER COLUMN "answers" SET DEFAULT '[]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" ALTER COLUMN "answers" SET DEFAULT '[]'`,
    )
  }
}
