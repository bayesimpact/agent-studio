import type { MigrationInterface, QueryRunner } from "typeorm"

export class UpdateTagDescription1773224108419 implements MigrationInterface {
  name = "UpdateTagDescription1773224108419"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document_tag" DROP COLUMN "description"`)
    await queryRunner.query(`ALTER TABLE "document_tag" ADD "description" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document_tag" DROP COLUMN "description"`)
    await queryRunner.query(`ALTER TABLE "document_tag" ADD "description" character varying`)
  }
}
