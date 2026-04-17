import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddEvaluationRun1776340425151 implements MigrationInterface {
  name = "AddEvaluationRun1776340425151"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "evaluation_run_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_run_id" uuid NOT NULL, "evaluation_dataset_record_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'match', "comparison" jsonb, "agent_raw_output" jsonb, "error_details" text, CONSTRAINT "PK_8ea277567f5d9172bdd779b175f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_c24c069d8963d6d5007a8fb09a" ON "evaluation_run_record" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_run" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_dataset_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "key_mapping" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "summary" jsonb, CONSTRAINT "PK_ed28e0d308c8a4b2d65b2e3ea00" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_345fa7eb322329b058c71e88fa" ON "evaluation_run" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run_record" ADD CONSTRAINT "FK_3aa4befb7968aeec4429449c212" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run_record" ADD CONSTRAINT "FK_554e48bd081421327b70f083a53" FOREIGN KEY ("evaluation_dataset_record_id") REFERENCES "evaluation_dataset_record"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run" ADD CONSTRAINT "FK_c474a69b9835b7d7640fd6e0979" FOREIGN KEY ("evaluation_dataset_id") REFERENCES "evaluation_dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run" ADD CONSTRAINT "FK_35e69f4fc9228ae3b85d6f6ac5b" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_run" DROP CONSTRAINT "FK_35e69f4fc9228ae3b85d6f6ac5b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run" DROP CONSTRAINT "FK_c474a69b9835b7d7640fd6e0979"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run_record" DROP CONSTRAINT "FK_554e48bd081421327b70f083a53"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_run_record" DROP CONSTRAINT "FK_3aa4befb7968aeec4429449c212"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_345fa7eb322329b058c71e88fa"`)
    await queryRunner.query(`DROP TABLE "evaluation_run"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_c24c069d8963d6d5007a8fb09a"`)
    await queryRunner.query(`DROP TABLE "evaluation_run_record"`)
  }
}
