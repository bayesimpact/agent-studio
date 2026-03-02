import type { MigrationInterface, QueryRunner } from "typeorm"

export class ExtractionAgentSession1772469179656 implements MigrationInterface {
  name = "ExtractionAgentSession1772469179656"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "extraction_agent_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "user_id" uuid NOT NULL, "document_id" uuid NOT NULL, "status" character varying NOT NULL, "type" character varying NOT NULL, "result" jsonb, "error_code" character varying, "error_details" jsonb, "effective_prompt" text NOT NULL, "schema_snapshot" jsonb NOT NULL, "trace_id" uuid NOT NULL, CONSTRAINT "PK_c9b68d0058a63ae5a230718352d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_61a7816417e62c32c400c3276e" ON "extraction_agent_session" ("organization_id", "project_id", "agent_id", "created_at") `,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" ADD CONSTRAINT "FK_7f6de462c60262ba6b9bb406ae4" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" ADD CONSTRAINT "FK_ea71c1a7cb9d4abfbfada3d1612" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" ADD CONSTRAINT "FK_c79394c6b0b332e42e2a3eea2d9" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" DROP CONSTRAINT "FK_c79394c6b0b332e42e2a3eea2d9"`,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" DROP CONSTRAINT "FK_ea71c1a7cb9d4abfbfada3d1612"`,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" DROP CONSTRAINT "FK_7f6de462c60262ba6b9bb406ae4"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_61a7816417e62c32c400c3276e"`)
    await queryRunner.query(`DROP TABLE "extraction_agent_session"`)
  }
}
