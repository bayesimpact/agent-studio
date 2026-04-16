import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameEvaluationExtractionEntities1776349804836 implements MigrationInterface {
  name = "RenameEvaluationExtractionEntities1776349804836"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_run_record" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_run" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_dataset_document" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_dataset_record" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_dataset" CASCADE`)

    await queryRunner.query(
      `CREATE TABLE "evaluation_extraction_dataset_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_extraction_dataset_id" uuid NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "PK_92e872090f6576a22fcbd39b24b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_61a3f6e33dbb63921328d72652" ON "evaluation_extraction_dataset_record" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_extraction_dataset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "name" character varying NOT NULL, "schema_mapping" jsonb NOT NULL, CONSTRAINT "PK_0c28b8f87b2105bd7676f2c0124" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3f9df3559a07284e6913fe0dbd" ON "evaluation_extraction_dataset" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_extraction_dataset_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "evaluation_extraction_dataset_id" uuid NOT NULL, "document_id" uuid NOT NULL, CONSTRAINT "UQ_19955dfb9e8bddca21a0e49ee29" UNIQUE ("evaluation_extraction_dataset_id", "document_id"), CONSTRAINT "PK_82113b2db339a63b32cc3737165" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_extraction_run_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_extraction_run_id" uuid NOT NULL, "evaluation_extraction_dataset_record_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'match', "comparison" jsonb, "agent_raw_output" jsonb, "error_details" text, CONSTRAINT "PK_7ef860b9f75572011f686930dd4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_c17f379c092804abade46043b7" ON "evaluation_extraction_run_record" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_extraction_run" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_extraction_dataset_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "key_mapping" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "summary" jsonb, CONSTRAINT "PK_ffa542787f3aefacbfdbe04ad26" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_c796fd779a5f9dbec135dcea52" ON "evaluation_extraction_run" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_record" ADD CONSTRAINT "FK_946721111ca84577158b500f11d" FOREIGN KEY ("evaluation_extraction_dataset_id") REFERENCES "evaluation_extraction_dataset"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_document" ADD CONSTRAINT "FK_46f73acd9bbd9e543c34a07acdc" FOREIGN KEY ("evaluation_extraction_dataset_id") REFERENCES "evaluation_extraction_dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_document" ADD CONSTRAINT "FK_c7fdcf2bdf26577d3bf9c943549" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run_record" ADD CONSTRAINT "FK_16f35bec469e7c7c1f11b76968b" FOREIGN KEY ("evaluation_extraction_run_id") REFERENCES "evaluation_extraction_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run_record" ADD CONSTRAINT "FK_ba50e6101d4a6e98e74e5c301a2" FOREIGN KEY ("evaluation_extraction_dataset_record_id") REFERENCES "evaluation_extraction_dataset_record"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" ADD CONSTRAINT "FK_462b1eeaa468f38631336404091" FOREIGN KEY ("evaluation_extraction_dataset_id") REFERENCES "evaluation_extraction_dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" ADD CONSTRAINT "FK_e424bb0837cc21e7acd68ebe2cc" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" DROP CONSTRAINT "FK_e424bb0837cc21e7acd68ebe2cc"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run" DROP CONSTRAINT "FK_462b1eeaa468f38631336404091"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run_record" DROP CONSTRAINT "FK_ba50e6101d4a6e98e74e5c301a2"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_run_record" DROP CONSTRAINT "FK_16f35bec469e7c7c1f11b76968b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_document" DROP CONSTRAINT "FK_c7fdcf2bdf26577d3bf9c943549"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_document" DROP CONSTRAINT "FK_46f73acd9bbd9e543c34a07acdc"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_extraction_dataset_record" DROP CONSTRAINT "FK_946721111ca84577158b500f11d"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_c796fd779a5f9dbec135dcea52"`)
    await queryRunner.query(`DROP TABLE "evaluation_extraction_run"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_c17f379c092804abade46043b7"`)
    await queryRunner.query(`DROP TABLE "evaluation_extraction_run_record"`)
    await queryRunner.query(`DROP TABLE "evaluation_extraction_dataset_document"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_3f9df3559a07284e6913fe0dbd"`)
    await queryRunner.query(`DROP TABLE "evaluation_extraction_dataset"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_61a3f6e33dbb63921328d72652"`)
    await queryRunner.query(`DROP TABLE "evaluation_extraction_dataset_record"`)
  }
}
