import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocumentUploadStatus1773762982599 implements MigrationInterface {
  name = "DocumentUploadStatus1773762982599"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" ADD "upload_status" character varying NOT NULL DEFAULT 'uploaded'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "upload_status"`)
  }
}
