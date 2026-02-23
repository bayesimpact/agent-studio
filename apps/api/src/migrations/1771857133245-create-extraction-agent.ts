import type { MigrationInterface, QueryRunner } from "typeorm"

export class DontsaveMig1771857133245 implements MigrationInterface {
  name = "DontsaveMig1771857133245"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_extraction_run" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "user_id" uuid NOT NULL, "document_id" uuid NOT NULL, "status" character varying NOT NULL, "result" jsonb, "error_code" character varying, "error_details" jsonb, "effective_prompt" text NOT NULL, "schema_snapshot" jsonb NOT NULL, "trace_id" uuid NOT NULL, CONSTRAINT "PK_b56a454aafe1fed8c11ebb7ca31" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_1fff4e31b54830babb92fae1df" ON "agent_extraction_run" ("organization_id", "project_id", "agent_id", "created_at") `,
    )
    await queryRunner.query(
      `ALTER TABLE "agent" ADD "type" character varying NOT NULL DEFAULT 'conversation'`,
    )
    await queryRunner.query(`ALTER TABLE "agent" ADD "instruction_prompt" text`)
    await queryRunner.query(`ALTER TABLE "agent" ADD "output_json_schema" jsonb`)
    await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "source_type" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" ADD CONSTRAINT "FK_00142731643075c7a93c11b5d50" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" ADD CONSTRAINT "FK_20429b3784327d152e1b5a31e7c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" ADD CONSTRAINT "FK_e77af61cfcdd04da46128972692" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_e77af61cfcdd04da46128972692"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_20429b3784327d152e1b5a31e7c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_00142731643075c7a93c11b5d50"`,
    )
    await queryRunner.query(
      `ALTER TABLE "document" ALTER COLUMN "source_type" SET DEFAULT 'project'`,
    )
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "output_json_schema"`)
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "instruction_prompt"`)
    await queryRunner.query(`ALTER TABLE "agent" DROP COLUMN "type"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_1fff4e31b54830babb92fae1df"`)
    await queryRunner.query(`DROP TABLE "agent_extraction_run"`)
  }
}
