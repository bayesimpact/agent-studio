import type { MigrationInterface, QueryRunner } from "typeorm"

export class FeatureFlagProject1775140755076 implements MigrationInterface {
  name = "FeatureFlagProject1775140755076"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag" DROP CONSTRAINT "FK_810f4659ca8bc56de66426eb06f"`,
    )
    await queryRunner.query(`DROP INDEX "public"."feature_flag_UNIQUE"`)
    await queryRunner.query(
      `ALTER TABLE "feature_flag" RENAME COLUMN "organization_id" TO "project_id"`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "feature_flag_UNIQUE" ON "feature_flag" ("feature_flag_key", "project_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "feature_flag" ADD CONSTRAINT "FK_75302feee9f7c001fcbf274e87e" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag" DROP CONSTRAINT "FK_75302feee9f7c001fcbf274e87e"`,
    )
    await queryRunner.query(`DROP INDEX "public"."feature_flag_UNIQUE"`)
    await queryRunner.query(
      `ALTER TABLE "feature_flag" RENAME COLUMN "project_id" TO "organization_id"`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "feature_flag_UNIQUE" ON "feature_flag" ("feature_flag_key", "organization_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "feature_flag" ADD CONSTRAINT "FK_810f4659ca8bc56de66426eb06f" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
