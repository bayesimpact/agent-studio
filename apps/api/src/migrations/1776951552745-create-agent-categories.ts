import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateAgentCategories1776951552745 implements MigrationInterface {
  name = "CreateAgentCategories1776951552745"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_agent_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_d2bbb5cc6fa930f6b18a44d48ca" UNIQUE ("project_id", "name"), CONSTRAINT "PK_b4e3d818ea27c763ccd7fe987e4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "conversation_agent_session_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_agent_session_id" uuid NOT NULL, "agent_category_id" uuid NOT NULL, "project_agent_category_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fdfc7f508502cebc8affb5d5ae3" UNIQUE ("conversation_agent_session_id", "agent_category_id"), CONSTRAINT "PK_50c1c0629d797f65b4b74f7bd90" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "agent_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "agent_id" uuid NOT NULL, "project_agent_category_id" uuid, "name" character varying NOT NULL, CONSTRAINT "UQ_75588dd6aed3dc7c4eba4684823" UNIQUE ("agent_id", "project_agent_category_id"), CONSTRAINT "UQ_c6de4d0f001dae31b320505397c" UNIQUE ("agent_id", "name"), CONSTRAINT "PK_4135387b0bf907ad3e57038f4ee" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" ADD "title" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_agent_category" ADD CONSTRAINT "FK_6ba4238200510c21eeeb35de883" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" ADD CONSTRAINT "FK_31cde670829907bfb6a509f1563" FOREIGN KEY ("conversation_agent_session_id") REFERENCES "conversation_agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" ADD CONSTRAINT "FK_9640f7be54b609d7c163f112e46" FOREIGN KEY ("agent_category_id") REFERENCES "agent_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" ADD CONSTRAINT "FK_efc8c36c3b2885e226bcb83cb5b" FOREIGN KEY ("project_agent_category_id") REFERENCES "project_agent_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_category" ADD CONSTRAINT "FK_cd78bec875bd4d049da0bf629f2" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_category" ADD CONSTRAINT "FK_c38964e2430170918e3bab398d7" FOREIGN KEY ("project_agent_category_id") REFERENCES "project_agent_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_category" DROP CONSTRAINT "FK_c38964e2430170918e3bab398d7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_category" DROP CONSTRAINT "FK_cd78bec875bd4d049da0bf629f2"`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" DROP CONSTRAINT "FK_efc8c36c3b2885e226bcb83cb5b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" DROP CONSTRAINT "FK_9640f7be54b609d7c163f112e46"`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session_category" DROP CONSTRAINT "FK_31cde670829907bfb6a509f1563"`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_agent_category" DROP CONSTRAINT "FK_6ba4238200510c21eeeb35de883"`,
    )
    await queryRunner.query(`ALTER TABLE "conversation_agent_session" DROP COLUMN "title"`)
    await queryRunner.query(`DROP TABLE "agent_category"`)
    await queryRunner.query(`DROP TABLE "conversation_agent_session_category"`)
    await queryRunner.query(`DROP TABLE "project_agent_category"`)
  }
}
