import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateMcpServerAndAgentMcpServer1776234933761 implements MigrationInterface {
  name = "CreateMcpServerAndAgentMcpServer1776234933761"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mcp_server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "preset_slug" character varying, "project_id" uuid, "encrypted_config" text NOT NULL, CONSTRAINT "UQ_21e566ba2d861c2fde619157db5" UNIQUE ("preset_slug"), CONSTRAINT "PK_940f98ed91dd060f63e6fc5634e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "agent_mcp_server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "agent_id" uuid NOT NULL, "mcp_server_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_ef87b5c52b7deee011ddac27cd1" UNIQUE ("agent_id", "mcp_server_id"), CONSTRAINT "PK_dc1c572844ade0d9caf88605fe4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "mcp_server" ADD CONSTRAINT "FK_810d04bee34821228437c61fd32" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_mcp_server" ADD CONSTRAINT "FK_4bec2369aaf2332399f21b80f5c" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_mcp_server" ADD CONSTRAINT "FK_feaac69a19a4682d521b20e2e72" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_mcp_server" DROP CONSTRAINT "FK_feaac69a19a4682d521b20e2e72"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_mcp_server" DROP CONSTRAINT "FK_4bec2369aaf2332399f21b80f5c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_810d04bee34821228437c61fd32"`,
    )
    await queryRunner.query(`DROP TABLE "agent_mcp_server"`)
    await queryRunner.query(`DROP TABLE "mcp_server"`)
  }
}
