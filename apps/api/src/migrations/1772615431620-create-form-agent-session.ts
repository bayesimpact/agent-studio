import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateFormAgentSession1772615431620 implements MigrationInterface {
  name = "CreateFormAgentSession1772615431620"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "form_agent_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "trace_id" uuid, "user_id" uuid NOT NULL, "type" character varying NOT NULL, "result" jsonb, CONSTRAINT "PK_61dc34e2df3b71ee97bb2e4544c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_ca972359d54a9e7cfe6d71c58d" ON "form_agent_session" ("organization_id", "project_id", "agent_id", "type") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ca972359d54a9e7cfe6d71c58d"`)
    await queryRunner.query(`DROP TABLE "form_agent_session"`)
  }
}
