import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserToAgentCsvExtractionRun1787156126972 implements MigrationInterface {
  name = "AddUserToAgentCsvExtractionRun1787156126972"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_csv_extraction_run" ADD "user_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "agent_csv_extraction_run" ADD CONSTRAINT "FK_2e4588a4ef3c9fb035b901253bd" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_csv_extraction_run" DROP CONSTRAINT "FK_2e4588a4ef3c9fb035b901253bd"`,
    )
    await queryRunner.query(`ALTER TABLE "agent_csv_extraction_run" DROP COLUMN "user_id"`)
  }
}
