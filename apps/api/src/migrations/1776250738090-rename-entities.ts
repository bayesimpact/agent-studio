import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameEntities1776250738090 implements MigrationInterface {
  name = "RenameEntities1776250738090"

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOldDatasetTable = await queryRunner.hasTable("evaluation-dataset")
    const hasNewDatasetTable = await queryRunner.hasTable("evaluation_dataset")
    if (hasOldDatasetTable && !hasNewDatasetTable) {
      await queryRunner.renameTable("evaluation-dataset", "evaluation_dataset")
    } else if (hasOldDatasetTable && hasNewDatasetTable) {
      await queryRunner.query(`DROP TABLE "evaluation-dataset" CASCADE`)
    }

    const hasOldRecordTable = await queryRunner.hasTable("evaluation-dataset-record")
    const hasNewRecordTable = await queryRunner.hasTable("evaluation_dataset_record")
    if (hasOldRecordTable && !hasNewRecordTable) {
      await queryRunner.renameTable("evaluation-dataset-record", "evaluation_dataset_record")
    } else if (hasOldRecordTable && hasNewRecordTable) {
      await queryRunner.query(`DROP TABLE "evaluation-dataset-record" CASCADE`)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasNewDatasetTable = await queryRunner.hasTable("evaluation_dataset")
    if (hasNewDatasetTable) {
      await queryRunner.renameTable("evaluation_dataset", "evaluation-dataset")
    }

    const hasNewRecordTable = await queryRunner.hasTable("evaluation_dataset_record")
    if (hasNewRecordTable) {
      await queryRunner.renameTable("evaluation_dataset_record", "evaluation-dataset-record")
    }
  }
}
