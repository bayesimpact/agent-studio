import type { MigrationInterface, QueryRunner } from "typeorm"

export class PdfPageCountColumns1787759412216 implements MigrationInterface {
  name = "PdfPageCountColumns1787759412216"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" ADD "pdf_page_count" integer`)
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" ADD "pdf_page_count" integer`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" DROP COLUMN "pdf_page_count"`,
    )
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "pdf_page_count"`)
  }
}
