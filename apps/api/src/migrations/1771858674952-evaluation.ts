import type { MigrationInterface, QueryRunner } from "typeorm"

export class Evaluation1771858674952 implements MigrationInterface {
  name = "Evaluation1771858674952"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "evaluation_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "trace_id" uuid NOT NULL, "output" character varying NOT NULL, "score" character varying NOT NULL, CONSTRAINT "PK_0a99319233ecea545abcf2fe8b9" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_393b0f28a1c9ee4d5cb24a0945" ON "evaluation_report" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "input" character varying NOT NULL, "expected_output" character varying NOT NULL, CONSTRAINT "PK_b72edd439b9db736f55b584fa54" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_76ed2aa183a791a671d32304d3" ON "evaluation" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_report" ADD CONSTRAINT "FK_08c8ea2cbde23fdea75d4d35154" FOREIGN KEY ("evaluation_id") REFERENCES "evaluation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_report" ADD CONSTRAINT "FK_e86d3a2655af3d17b70e780e777" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation" ADD CONSTRAINT "FK_255d175473dfeb23410514b7769" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation" DROP CONSTRAINT "FK_255d175473dfeb23410514b7769"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_report" DROP CONSTRAINT "FK_e86d3a2655af3d17b70e780e777"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_report" DROP CONSTRAINT "FK_08c8ea2cbde23fdea75d4d35154"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_76ed2aa183a791a671d32304d3"`)
    await queryRunner.query(`DROP TABLE "evaluation"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_393b0f28a1c9ee4d5cb24a0945"`)
    await queryRunner.query(`DROP TABLE "evaluation_report"`)
  }
}
