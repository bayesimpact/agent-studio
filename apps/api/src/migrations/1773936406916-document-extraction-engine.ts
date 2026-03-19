import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocumentExtractionEngine1773936406916 implements MigrationInterface {
  name = "DocumentExtractionEngine1773936406916"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" ADD "extraction_engine" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "extraction_engine"`)
  }
}
