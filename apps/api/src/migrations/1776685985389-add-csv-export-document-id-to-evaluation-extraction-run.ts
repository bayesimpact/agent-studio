import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCsvExportDocumentIdToEvaluationExtractionRun1776685985389
  implements MigrationInterface
{
  name = "AddCsvExportDocumentIdToEvaluationExtractionRun1776685985389"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" ADD "csv_export_document_id" uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" ADD CONSTRAINT "FK_94394f57b164465693129c0c31f" FOREIGN KEY ("csv_export_document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" DROP CONSTRAINT "FK_94394f57b164465693129c0c31f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" DROP COLUMN "csv_export_document_id"`,
    )
  }
}
