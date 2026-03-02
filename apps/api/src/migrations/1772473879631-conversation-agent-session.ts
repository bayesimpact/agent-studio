import type { MigrationInterface, QueryRunner } from "typeorm"

export class ConversationAgentSessionMig1772473879631 implements MigrationInterface {
  name = "ConversationAgentSessionMig1772473879631"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b"`,
    )
    await queryRunner.query(
      `CREATE TABLE "conversation_agent_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "trace_id" uuid, "user_id" uuid NOT NULL, "type" character varying NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "PK_891d1c22186546d32c9911cbfee" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_c3ada66f0ed394ecddabf5112a" ON "conversation_agent_session" ("organization_id", "project_id", "agent_id", "type") `,
    )
    await queryRunner.query(
      `INSERT INTO "conversation_agent_session" (id, created_at, updated_at, deleted_at, organization_id, project_id, agent_id, trace_id, user_id, type, expires_at) SELECT id, created_at, updated_at, deleted_at, organization_id, project_id, agent_id, trace_id, user_id, type, expires_at FROM "agent_session" ON CONFLICT (id) DO NOTHING`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_152a42ea0dc5fe04a227a16611e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_0b498e8a40fa9f8314d70ffee68"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_29ea25d342123db9debf79caa7e"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_e4982b00266176d12542e0226e"`)
    await queryRunner.query(`DROP TABLE "agent_session"`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b" FOREIGN KEY ("session_id") REFERENCES "conversation_agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" ADD CONSTRAINT "FK_519d610e038211f21b3975aa16d" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" ADD CONSTRAINT "FK_98995c6e0bb9bb3d8ebcdd14cef" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" ADD CONSTRAINT "FK_63d41615ab9cf796d9c46fb1bb6" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" DROP CONSTRAINT "FK_63d41615ab9cf796d9c46fb1bb6"`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" DROP CONSTRAINT "FK_98995c6e0bb9bb3d8ebcdd14cef"`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" DROP CONSTRAINT "FK_519d610e038211f21b3975aa16d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_c3ada66f0ed394ecddabf5112a"`)
    await queryRunner.query(
      `CREATE TABLE "agent_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agent_id" uuid NOT NULL, "trace_id" uuid, "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "type" character varying NOT NULL, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, CONSTRAINT "PK_5b8bdf54e8520f352257f5d2633" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e4982b00266176d12542e0226e" ON "agent_session" ("organization_id", "project_id", "agent_id", "type") `,
    )
    await queryRunner.query(
      `INSERT INTO "agent_session" (id, agent_id, trace_id, user_id, organization_id, type, expires_at, created_at, updated_at, deleted_at, project_id) SELECT id, agent_id, trace_id, user_id, organization_id, type, expires_at, created_at, updated_at, deleted_at, project_id FROM "conversation_agent_session" ON CONFLICT (id) DO NOTHING`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_152a42ea0dc5fe04a227a16611e" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_0b498e8a40fa9f8314d70ffee68" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_29ea25d342123db9debf79caa7e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`DROP TABLE "conversation_agent_session"`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }
}
