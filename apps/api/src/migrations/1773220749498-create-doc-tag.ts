import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateDocumentTag1773220749498 implements MigrationInterface {
  name = "CreateDocumentTag1773220749498"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document_tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "parent_id" uuid, CONSTRAINT "PK_0bf6620edea18040675a2700804" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_84ea5fc4e63628a9b27df515ea" ON "document_tag" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "document_document_tag" ("document_id" uuid NOT NULL, "document_tag_id" uuid NOT NULL, CONSTRAINT "PK_13fb3feb7b04a3415dd7dddb122" PRIMARY KEY ("document_id", "document_tag_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e71f0b0713447d74031909a0de" ON "document_document_tag" ("document_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2698190428b7507ce90ad1c93e" ON "document_document_tag" ("document_tag_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "document_tag" ADD CONSTRAINT "FK_ded43c7c8b73cc1423fe53f2a96" FOREIGN KEY ("parent_id") REFERENCES "document_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "document_document_tag" ADD CONSTRAINT "FK_e71f0b0713447d74031909a0dee" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "document_document_tag" ADD CONSTRAINT "FK_2698190428b7507ce90ad1c93ee" FOREIGN KEY ("document_tag_id") REFERENCES "document_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_document_tag" DROP CONSTRAINT "FK_2698190428b7507ce90ad1c93ee"`,
    )
    await queryRunner.query(
      `ALTER TABLE "document_document_tag" DROP CONSTRAINT "FK_e71f0b0713447d74031909a0dee"`,
    )
    await queryRunner.query(
      `ALTER TABLE "document_tag" DROP CONSTRAINT "FK_ded43c7c8b73cc1423fe53f2a96"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_2698190428b7507ce90ad1c93e"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_e71f0b0713447d74031909a0de"`)
    await queryRunner.query(`DROP TABLE "document_document_tag"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_84ea5fc4e63628a9b27df515ea"`)
    await queryRunner.query(`DROP TABLE "document_tag"`)
  }
}
