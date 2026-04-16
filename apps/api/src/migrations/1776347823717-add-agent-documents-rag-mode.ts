import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddAgentDocumentsRagMode1776347823717 implements MigrationInterface {
  name = "AddAgentDocumentsRagMode1776347823717"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent" ADD "documents_rag_mode" character varying NOT NULL DEFAULT 'all'`,
    )
    await queryRunner.query(`
      UPDATE "agent"
      SET "documents_rag_mode" = 'tags'
      WHERE id IN (
        SELECT DISTINCT "agent_id"
        FROM "agent_document_tag"
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "documents_rag_mode"`)
  }
}
