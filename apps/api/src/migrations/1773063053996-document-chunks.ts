import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocumentChunk1773063053996 implements MigrationInterface {
  name = "DocumentChunk1773063053996"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "document_id" uuid NOT NULL, "content" text NOT NULL, "chunk_index" integer NOT NULL, CONSTRAINT "PK_70d9772bf367d82f9b7e568c87c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9366a6054307068f4ca06a91c1" ON "document_chunk" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "document" ADD "embedding_status" character varying NOT NULL DEFAULT 'pending'`,
    )
    // Add embedding column (not supported by TypeORM so we need to use raw SQL)
    await queryRunner.query(
      `ALTER TABLE "document_chunk" ADD COLUMN IF NOT EXISTS "embedding" vector(768)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "embedding_status"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9366a6054307068f4ca06a91c1"`)
    await queryRunner.query(`DROP TABLE "document_chunk"`)
  }
}
