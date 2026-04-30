import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateAgentMessageAttachmentDocuments1777466968517 implements MigrationInterface {
  name = "CreateAgentMessageAttachmentDocuments1777466968517"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_message_attachment_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" integer NOT NULL, "storage_relative_path" character varying NOT NULL, CONSTRAINT "PK_109b1087b59ce1a36320432f5d8" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_258749775e306407a47633c563" ON "agent_message_attachment_document" ("organization_id", "project_id", "created_at") `,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" ADD "attachment_document_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "UQ_109b1087b59ce1a36320432f5d8" UNIQUE ("attachment_document_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" ADD CONSTRAINT "FK_c9c745ac9b08497909207fbbabe" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" ADD CONSTRAINT "FK_5615c41543034fc988cdbba5e61" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    // Backfill message attachments that were previously stored as documents.
    // We preserve the legacy document IDs so agent_message.attachment_document_id can reuse document_id directly.
    await queryRunner.query(`
      INSERT INTO "agent_message_attachment_document" (
        "id",
        "created_at",
        "updated_at",
        "deleted_at",
        "organization_id",
        "project_id",
        "file_name",
        "mime_type",
        "size",
        "storage_relative_path"
      )
      SELECT
        legacy_document."id",
        legacy_document."created_at",
        legacy_document."updated_at",
        legacy_document."deleted_at",
        legacy_document."organization_id",
        legacy_document."project_id",
        COALESCE(legacy_document."file_name", legacy_document."title"),
        legacy_document."mime_type",
        COALESCE(legacy_document."size", 0),
        legacy_document."storage_relative_path"
      FROM (
        SELECT DISTINCT document.*
        FROM "agent_message"
        INNER JOIN "document" ON "document"."id" = "agent_message"."document_id"
        WHERE "agent_message"."document_id" IS NOT NULL
          AND "document"."source_type" = 'agentSessionMessage'
          AND "document"."storage_relative_path" IS NOT NULL
      ) AS legacy_document
    `)
    await queryRunner.query(`
      UPDATE "agent_message" AS agent_message
      SET "attachment_document_id" = agent_message."document_id"
      FROM "agent_message_attachment_document" AS attachment_document
      WHERE attachment_document."id" = agent_message."document_id"
        AND agent_message."attachment_document_id" IS NULL
    `)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_109b1087b59ce1a36320432f5d8" FOREIGN KEY ("attachment_document_id") REFERENCES "agent_message_attachment_document"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_109b1087b59ce1a36320432f5d8"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" DROP CONSTRAINT "FK_5615c41543034fc988cdbba5e61"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_attachment_document" DROP CONSTRAINT "FK_c9c745ac9b08497909207fbbabe"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "UQ_109b1087b59ce1a36320432f5d8"`,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" DROP COLUMN "attachment_document_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_258749775e306407a47633c563"`)
    await queryRunner.query(`DROP TABLE "agent_message_attachment_document"`)
  }
}
