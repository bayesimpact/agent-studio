import type { MigrationInterface, QueryRunner } from "typeorm"

export class FirstInit1770390907907 implements MigrationInterface {
  name = "FirstInit1770390907907"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "role" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca24d6d1a91810c7decccf091c3" UNIQUE ("user_id", "organization_id"), CONSTRAINT "PK_79d3d7350ae33ad6fe1743df86c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "title" character varying NOT NULL, "content" character varying, "file_name" character varying, "language" character varying NOT NULL DEFAULT 'en', "mime_type" character varying NOT NULL, "size" integer, "storage_relative_path" character varying, CONSTRAINT "PK_e2894a5867e06ae2e8889f1173f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "organization_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "agent" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "project_id" uuid NOT NULL, "name" character varying NOT NULL, "default_prompt" text NOT NULL, "model" character varying NOT NULL, "temperature" numeric(3,2) NOT NULL DEFAULT '0', "locale" character varying NOT NULL, CONSTRAINT "PK_1000e989398c5d4ed585cf9a46f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "agent_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "status" character varying, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "tool_calls" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f50e019467982fe7e2666efd98d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3ff393a5fa21f526cc370539e1" ON "agent_message" ("session_id", "created_at") `,
    )
    await queryRunner.query(
      `CREATE TABLE "agent_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agent_id" uuid NOT NULL, "trace_id" uuid, "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "type" character varying NOT NULL, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b8bdf54e8520f352257f5d2633" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_d0e43de088b014d8899fff6692" ON "agent_session" ("expires_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_bfe74fcb5f049ec7ba5c7ec5e4" ON "agent_session" ("organization_id", "type") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e581f8875b2c8bad9ca4dc697a" ON "agent_session" ("agent_id", "type") `,
    )
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth0_id" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying, "picture_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5222bec366027bdf8b112120013" UNIQUE ("auth0_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_13c0b9b73e272c78393908bfe31" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_1e9b66eae483a290addd3d0d657" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "resource" ADD CONSTRAINT "FK_724571f4e06119501256dfe1639" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_e4616ee32e66481cf9b9f1a6466" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" ADD CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_29ea25d342123db9debf79caa7e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_0b498e8a40fa9f8314d70ffee68"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_152a42ea0dc5fe04a227a16611e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message" DROP CONSTRAINT "FK_ce1742d31c9cd90c6089b10245b"`,
    )
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0"`)
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_e4616ee32e66481cf9b9f1a6466"`,
    )
    await queryRunner.query(
      `ALTER TABLE "resource" DROP CONSTRAINT "FK_724571f4e06119501256dfe1639"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_1e9b66eae483a290addd3d0d657"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_13c0b9b73e272c78393908bfe31"`,
    )
    await queryRunner.query(`DROP TABLE "user"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_e581f8875b2c8bad9ca4dc697a"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bfe74fcb5f049ec7ba5c7ec5e4"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d0e43de088b014d8899fff6692"`)
    await queryRunner.query(`DROP TABLE "agent_session"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_3ff393a5fa21f526cc370539e1"`)
    await queryRunner.query(`DROP TABLE "agent_message"`)
    await queryRunner.query(`DROP TABLE "agent"`)
    await queryRunner.query(`DROP TABLE "project"`)
    await queryRunner.query(`DROP TABLE "resource"`)
    await queryRunner.query(`DROP TABLE "organization"`)
    await queryRunner.query(`DROP TABLE "user_membership"`)
  }
}
