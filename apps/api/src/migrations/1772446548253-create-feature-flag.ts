import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateFeatureFlag1772446548253 implements MigrationInterface {
  name = "CreateFeatureFlag1772446548253"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feature_flag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "feature_flag_key" character varying NOT NULL, CONSTRAINT "PK_f390205410d884907604a90c0f4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "feature_flag_UNIQUE" ON "feature_flag" ("feature_flag_key", "organization_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "feature_flag" ADD CONSTRAINT "FK_810f4659ca8bc56de66426eb06f" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag" DROP CONSTRAINT "FK_810f4659ca8bc56de66426eb06f"`,
    )
    await queryRunner.query(`DROP INDEX "public"."feature_flag_UNIQUE"`)
    await queryRunner.query(`DROP TABLE "feature_flag"`)
  }
}
