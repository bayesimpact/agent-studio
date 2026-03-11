import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocumentChunks1773158795873 implements MigrationInterface {
  name = "DocumentChunks1773158795873"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "document_id" uuid NOT NULL, "content" text NOT NULL, "chunk_index" integer NOT NULL, CONSTRAINT "PK_70d9772bf367d82f9b7e568c87c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9366a6054307068f4ca06a91c1" ON "document_chunk" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "document_chunk_embedding" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "document_chunk_id" uuid NOT NULL, "model_name" character varying NOT NULL, CONSTRAINT "PK_0fb29144adb86824deea2612270" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f0f408b52cdfb0db857c8ffca8" ON "document_chunk_embedding" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_document_chunk_embedding_chunk_model" ON "document_chunk_embedding" ("document_chunk_id", "model_name") `,
    )
    await queryRunner.query(
      `ALTER TABLE "document" ADD "embedding_status" character varying NOT NULL DEFAULT 'pending'`,
    )
    await queryRunner.query(
      `ALTER TABLE "document_chunk_embedding" ADD CONSTRAINT "FK_702e98a531ba1adeb7115c90956" FOREIGN KEY ("document_chunk_id") REFERENCES "document_chunk"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    // Add embedding column (not supported by TypeORM so we need to use raw SQL)
    await queryRunner.query(
      `ALTER TABLE "document_chunk_embedding" ADD COLUMN IF NOT EXISTS "embedding" vector(3072)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_chunk_embedding" DROP CONSTRAINT "FK_702e98a531ba1adeb7115c90956"`,
    )
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "embedding_status"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_document_chunk_embedding_chunk_model"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_f0f408b52cdfb0db857c8ffca8"`)
    await queryRunner.query(`DROP TABLE "document_chunk_embedding"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9366a6054307068f4ca06a91c1"`)
    await queryRunner.query(`DROP TABLE "document_chunk"`)
  }
}
