import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameEntities1776250738090 implements MigrationInterface {
  name = "RenameEntities1776250738090"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename evaluation-dataset to evaluation_dataset
    await queryRunner.renameTable("evaluation-dataset", "evaluation_dataset")
    // Rename evaluation-dataset-record to evaluation_dataset_record
    await queryRunner.renameTable("evaluation-dataset-record", "evaluation_dataset_record")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename evaluation_dataset back to evaluation-dataset
    await queryRunner.renameTable("evaluation_dataset", "evaluation-dataset")
    // Rename evaluation_dataset_record back to evaluation-dataset-record
    await queryRunner.renameTable("evaluation_dataset_record", "evaluation-dataset-record")
  }
}
