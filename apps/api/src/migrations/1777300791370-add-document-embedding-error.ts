import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddDocumentEmbeddingError1777300791370 implements MigrationInterface {
  name = "AddDocumentEmbeddingError1777300791370"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" ADD "embedding_error" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "embedding_error"`)
  }
}
