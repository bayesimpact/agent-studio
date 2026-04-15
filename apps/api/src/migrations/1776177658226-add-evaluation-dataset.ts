import type { MigrationInterface, QueryRunner } from "typeorm"

export class EvaluationDataset1776177658226 implements MigrationInterface {
  name = "EvaluationDataset1776177658226"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "evaluation-dataset-record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evaluation_dataset_id" uuid NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "PK_2603b4f131b6a1ac82f5c9ddcb5" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e4569f76a693b5270658996fe2" ON "evaluation-dataset-record" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation-dataset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "name" character varying NOT NULL, "schema_mapping" jsonb NOT NULL, CONSTRAINT "PK_2714a5d1d23e533a919c407aa14" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_d695d0937f33a310ade2dacc92" ON "evaluation-dataset" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "evaluation_dataset_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "evaluation_dataset_id" uuid NOT NULL, "document_id" uuid NOT NULL, CONSTRAINT "UQ_552277540321d74b51b6e261b66" UNIQUE ("evaluation_dataset_id", "document_id"), CONSTRAINT "PK_abd007932cf48c24b099a69ce95" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation-dataset-record" ADD CONSTRAINT "FK_2f2dce3bab61f065fb918f75e72" FOREIGN KEY ("evaluation_dataset_id") REFERENCES "evaluation-dataset"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_dataset_document" ADD CONSTRAINT "FK_24696e7d27694fd5b313218e94c" FOREIGN KEY ("evaluation_dataset_id") REFERENCES "evaluation-dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_dataset_document" ADD CONSTRAINT "FK_27a9b279f6370446cec7c7a2a0d" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluation_dataset_document" DROP CONSTRAINT "FK_27a9b279f6370446cec7c7a2a0d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation_dataset_document" DROP CONSTRAINT "FK_24696e7d27694fd5b313218e94c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "evaluation-dataset-record" DROP CONSTRAINT "FK_2f2dce3bab61f065fb918f75e72"`,
    )
    await queryRunner.query(`DROP TABLE "evaluation_dataset_document"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d695d0937f33a310ade2dacc92"`)
    await queryRunner.query(`DROP TABLE "evaluation-dataset"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_e4569f76a693b5270658996fe2"`)
    await queryRunner.query(`DROP TABLE "evaluation-dataset-record"`)
  }
}
