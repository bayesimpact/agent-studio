import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameResourcesToDocuments1770640531451 implements MigrationInterface {
  name = "RenameResourcesToDocuments1770640531451"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "title" character varying NOT NULL, "content" character varying, "file_name" character varying, "language" character varying NOT NULL DEFAULT 'en', "mime_type" character varying NOT NULL, "size" integer, "storage_relative_path" character varying, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`DROP TABLE "resource"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea"`,
    )
    await queryRunner.query(`DROP TABLE "document"`)

    await queryRunner.query(
      `CREATE TABLE "resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "title" character varying NOT NULL, "content" character varying, "file_name" character varying, "language" character varying NOT NULL DEFAULT 'en', "mime_type" character varying NOT NULL, "size" integer, "storage_relative_path" character varying, CONSTRAINT "PK_e2894a5867e06ae2e8889f1173f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "resource" ADD CONSTRAINT "FK_724571f4e06119501256dfe1639" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
