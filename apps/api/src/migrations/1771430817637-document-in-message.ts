import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocumentInMessage1771430817637 implements MigrationInterface {
  name = "DocumentInMessage1771430817637"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" ADD "source_type" character varying NOT NULL DEFAULT 'project'`,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" ADD "document_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "UQ_6b25db78895774a1e9e5c646816" UNIQUE ("document_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_6b25db78895774a1e9e5c646816" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_6b25db78895774a1e9e5c646816"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "UQ_6b25db78895774a1e9e5c646816"`,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" DROP COLUMN "document_id"`)
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "source_type"`)
  }
}
