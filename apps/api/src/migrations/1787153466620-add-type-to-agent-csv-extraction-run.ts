import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddTypeToAgentCsvExtractionRun1787153466620 implements MigrationInterface {
  name = "AddTypeToAgentCsvExtractionRun1787153466620"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_csv_extraction_run" ADD "type" character varying NOT NULL DEFAULT 'playground'`,
    )
    // Backfill from the CSV uploader's agent membership: agent-level "member"s operate the Desk
    // surface, so their runs are live. Owners, admins, and uploaders without an agent membership
    // keep the 'playground' default set by the ADD COLUMN above.
    await queryRunner.query(
      `UPDATE "agent_csv_extraction_run" AS run
       SET "type" = 'live'
       FROM "agent_settings" AS settings,
            "document" AS doc,
            "user_membership" AS membership
       WHERE settings."id" = run."agent_settings_id"
         AND doc."id" = run."csv_document_id"
         AND membership."user_id" = doc."user_id"
         AND membership."resource_type" = 'agent'
         AND membership."resource_id" = settings."agent_id"
         AND membership."role" = 'member'
         AND membership."deleted_at" IS NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent_csv_extraction_run" DROP COLUMN "type"`)
  }
}
