import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddTypeToAgentCsvExtractionRun1787153466620 implements MigrationInterface {
  name = "AddTypeToAgentCsvExtractionRun1787153466620"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_csv_extraction_run" ADD "type" character varying NOT NULL DEFAULT 'playground'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_csv_extraction_run" DROP COLUMN "type"`)
  }
}
