import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddTraceIdToEvaluationExtractionRunRecord1776432552806 implements MigrationInterface {
  name = "AddTraceIdToEvaluationExtractionRunRecord1776432552806"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run_record" ADD "trace_id" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "evaluation_extraction_run_record" DROP COLUMN "trace_id"`)
  }
}
