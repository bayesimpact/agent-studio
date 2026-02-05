import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddResourceEntity1770138990418 implements MigrationInterface {
  name = "AddResourceEntity1770138990418"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "title" character varying NOT NULL, "content" character varying, "file_name" character varying, "language" character varying NOT NULL DEFAULT 'en', "mime_type" character varying NOT NULL, "size" integer, "storage_relative_path" character varying, CONSTRAINT "PK_e2894a5867e06ae2e8889f1173f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`ALTER TABLE "chat_bot" ADD "deleted_at" TIMESTAMP`)
    await queryRunner.query(
      `ALTER TABLE "resource" ADD CONSTRAINT "FK_724571f4e06119501256dfe1639" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resource" DROP CONSTRAINT "FK_724571f4e06119501256dfe1639"`,
    )
    await queryRunner.query(`ALTER TABLE "chat_bot" DROP COLUMN "deleted_at"`)
    await queryRunner.query(`DROP TABLE "resource"`)
  }
}
