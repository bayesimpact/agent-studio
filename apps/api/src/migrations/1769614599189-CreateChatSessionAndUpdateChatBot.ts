import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateChatSessionAndUpdateChatBot1769614599189 implements MigrationInterface {
  name = "CreateChatSessionAndUpdateChatBot1769614599189"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_b369bfb0586d848e7f52f47d492"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_b1c431db43478fef45b5c2a52bf"`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_bot" DROP CONSTRAINT "FK_e64a37e39f0fb5ce866643ce009"`,
    )
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_585c8ce06628c70b70100bfb842"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_user_membership_user_organization"`)
    await queryRunner.query(
      `CREATE TABLE "chat_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chatbot_id" uuid NOT NULL, "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "type" character varying NOT NULL, "messages" jsonb NOT NULL, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9017c2ee500cd1ba895752a0aa7" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0e1d53a7228a9b05d5c670f345" ON "chat_session" ("expires_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_bc547a549096fefa1cb725bb67" ON "chat_session" ("organization_id", "type") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9806343d1fcbc822f8c2750b54" ON "chat_session" ("chatbot_id", "type") `,
    )
    await queryRunner.query(`ALTER TABLE "chat_bot" ADD "model" character varying NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "chat_bot" ADD "temperature" numeric(3,2) NOT NULL DEFAULT '0'`,
    )
    await queryRunner.query(`ALTER TABLE "chat_bot" ADD "locale" character varying NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "UQ_ca24d6d1a91810c7decccf091c3" UNIQUE ("user_id", "organization_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_13c0b9b73e272c78393908bfe31" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_1e9b66eae483a290addd3d0d657" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_34803e4793d13b973f012952dfe" FOREIGN KEY ("chatbot_id") REFERENCES "chat_bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "FK_f9734643b9475716317c7b0c75c" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_bot" ADD CONSTRAINT "FK_c325e136d171c01945a68ec75b5" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_e4616ee32e66481cf9b9f1a6466" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_e4616ee32e66481cf9b9f1a6466"`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_bot" DROP CONSTRAINT "FK_c325e136d171c01945a68ec75b5"`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_f9734643b9475716317c7b0c75c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT "FK_34803e4793d13b973f012952dfe"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_1e9b66eae483a290addd3d0d657"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "FK_13c0b9b73e272c78393908bfe31"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" DROP CONSTRAINT "UQ_ca24d6d1a91810c7decccf091c3"`,
    )
    await queryRunner.query(`ALTER TABLE "chat_bot" DROP COLUMN "locale"`)
    await queryRunner.query(`ALTER TABLE "chat_bot" DROP COLUMN "temperature"`)
    await queryRunner.query(`ALTER TABLE "chat_bot" DROP COLUMN "model"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9806343d1fcbc822f8c2750b54"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bc547a549096fefa1cb725bb67"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_0e1d53a7228a9b05d5c670f345"`)
    await queryRunner.query(`DROP TABLE "chat_session"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_membership_user_organization" ON "user_membership" ("organization_id", "user_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_585c8ce06628c70b70100bfb842" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "chat_bot" ADD CONSTRAINT "FK_e64a37e39f0fb5ce866643ce009" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_b1c431db43478fef45b5c2a52bf" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_membership" ADD CONSTRAINT "FK_b369bfb0586d848e7f52f47d492" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }
}
