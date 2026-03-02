import type { MigrationInterface, QueryRunner } from "typeorm"

export class MoveExtractionAgentSessions1772469409390 implements MigrationInterface {
  name = "MoveExtractionAgentSessions1772469409390"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "extraction_agent_session" SELECT * FROM "agent_extraction_run" ON CONFLICT (id) DO NOTHING`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_e77af61cfcdd04da46128972692"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_20429b3784327d152e1b5a31e7c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_extraction_run" DROP CONSTRAINT "FK_00142731643075c7a93c11b5d50"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_1fff4e31b54830babb92fae1df"`)
    await queryRunner.query(`DROP TABLE "agent_extraction_run"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_extraction_run" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "user_id" uuid NOT NULL, "document_id" uuid NOT NULL, "status" character varying NOT NULL, "type" character varying NOT NULL, "result" jsonb, "error_code" character varying, "error_details" jsonb, "effective_prompt" text NOT NULL, "schema_snapshot" jsonb NOT NULL, "trace_id" uuid NOT NULL, CONSTRAINT "PK_b56a454aafe1fed8c11ebb7ca31" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_1fff4e31b54830babb92fae1df" ON "agent_extraction_run" ("organization_id", "project_id", "agent_id", "created_at") `,
    )
    await queryRunner.query(
      `INSERT INTO "agent_extraction_run" SELECT * FROM "extraction_agent_session" ON CONFLICT (id) DO NOTHING`,
    )
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
}
