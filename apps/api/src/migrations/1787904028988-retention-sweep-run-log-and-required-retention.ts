import type { MigrationInterface, QueryRunner } from "typeorm"

export class RetentionSweepRunLogAndRequiredRetention1787904028988 implements MigrationInterface {
  name = "RetentionSweepRunLogAndRequiredRetention1787904028988"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversation_retention_sweep_run" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "ran_at" TIMESTAMP NOT NULL, "purged_count" integer NOT NULL DEFAULT '0', "status" character varying NOT NULL, "report" text NOT NULL, CONSTRAINT "PK_eee912928c4ebace177a4e7fc4a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_a5983c43791a892b6672d1e361" ON "conversation_retention_sweep_run" ("project_id", "ran_at") `,
    )
    // "Keep forever" (null) disappears: those projects get the maximum
    // retention (10 years) instead (#677).
    await queryRunner.query(
      `UPDATE "project" SET "conversation_retention_days" = 3650 WHERE "conversation_retention_days" IS NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "conversation_retention_days" SET NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "conversation_retention_days" DROP NOT NULL`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_a5983c43791a892b6672d1e361"`)
    await queryRunner.query(`DROP TABLE "conversation_retention_sweep_run"`)
  }
}
