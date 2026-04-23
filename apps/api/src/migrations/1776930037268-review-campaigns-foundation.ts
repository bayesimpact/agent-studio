import type { MigrationInterface, QueryRunner } from "typeorm"

export class ReviewCampaignsFoundation1776930037268 implements MigrationInterface {
  name = "ReviewCampaignsFoundation1776930037268"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "review_campaign_membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" character varying NOT NULL, "invited_at" TIMESTAMP NOT NULL, "accepted_at" TIMESTAMP, CONSTRAINT "UQ_26931b663bf82bd1129a7ccb6ba" UNIQUE ("campaign_id", "user_id", "role"), CONSTRAINT "PK_c0095b3552bdc7bf5719a826fb0" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_004f4d617fd73f842c94265892" ON "review_campaign_membership" ("organization_id", "project_id", "campaign_id", "user_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "tester_campaign_survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "user_id" uuid NOT NULL, "overall_rating" smallint NOT NULL, "comment" text, "answers" jsonb NOT NULL DEFAULT '[]'::jsonb, "submitted_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_ebdd0fd3e95c88fe534dae805a1" UNIQUE ("campaign_id", "user_id"), CONSTRAINT "PK_fa1c992376332256666717a755f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_07ac47be13ab20357076efb8a1" ON "tester_campaign_survey" ("organization_id", "project_id", "campaign_id", "user_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "tester_session_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "session_id" uuid NOT NULL, "session_type" character varying NOT NULL, "overall_rating" smallint NOT NULL, "comment" text, "answers" jsonb NOT NULL DEFAULT '[]'::jsonb, CONSTRAINT "UQ_83a3f3dc4edc090a7a2dc612eaa" UNIQUE ("session_id"), CONSTRAINT "PK_516dcd6a2063cd9306cc4f759bd" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_651ca5c24d9213be0551b9a12f" ON "tester_session_feedback" ("organization_id", "project_id", "campaign_id", "session_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "review_campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "status" character varying NOT NULL DEFAULT 'draft', "tester_per_session_questions" jsonb NOT NULL DEFAULT '[]'::jsonb, "tester_end_of_phase_questions" jsonb NOT NULL DEFAULT '[]'::jsonb, "reviewer_questions" jsonb NOT NULL DEFAULT '[]'::jsonb, "activated_at" TIMESTAMP, "closed_at" TIMESTAMP, CONSTRAINT "PK_6ff6e957322f85dfac5028d807c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_79abb17828bae2c3956f1f8c19" ON "review_campaign" ("organization_id", "project_id", "agent_id") `,
    )
    await queryRunner.query(`ALTER TABLE "extraction_agent_session" ADD "campaign_id" uuid`)
    await queryRunner.query(`ALTER TABLE "form_agent_session" ADD "campaign_id" uuid`)
    await queryRunner.query(`ALTER TABLE "conversation_agent_session" ADD "campaign_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" ADD CONSTRAINT "FK_af6e9d82bc657109fa57d511623" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" ADD CONSTRAINT "FK_cfd79c8f667949aca3d41115809" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" ADD CONSTRAINT "FK_fffc762fe8084a572eb10f410fc" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" ADD CONSTRAINT "FK_b8b2c65223fd2c3d936856f4244" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" ADD CONSTRAINT "FK_3e5aee32dc43a87d4c515e036e7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_session_feedback" ADD CONSTRAINT "FK_078fda6af7b0c42386eb1887b9e" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ADD CONSTRAINT "FK_4293710ce20b2bf8bb4e6dbd64d" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" ADD CONSTRAINT "FK_ab2a40ee664cacdb2e2f1f589bc" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "form_agent_session" ADD CONSTRAINT "FK_77aa08e22f91f71444a09cf039d" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" ADD CONSTRAINT "FK_82f33744534e55b27e0943dfc95" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation_agent_session" DROP CONSTRAINT "FK_82f33744534e55b27e0943dfc95"`,
    )
    await queryRunner.query(
      `ALTER TABLE "form_agent_session" DROP CONSTRAINT "FK_77aa08e22f91f71444a09cf039d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" DROP CONSTRAINT "FK_ab2a40ee664cacdb2e2f1f589bc"`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign" DROP CONSTRAINT "FK_4293710ce20b2bf8bb4e6dbd64d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_session_feedback" DROP CONSTRAINT "FK_078fda6af7b0c42386eb1887b9e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" DROP CONSTRAINT "FK_3e5aee32dc43a87d4c515e036e7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tester_campaign_survey" DROP CONSTRAINT "FK_b8b2c65223fd2c3d936856f4244"`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" DROP CONSTRAINT "FK_fffc762fe8084a572eb10f410fc"`,
    )
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" DROP CONSTRAINT "FK_cfd79c8f667949aca3d41115809"`,
    )
    await queryRunner.query(
      `ALTER TABLE "extraction_agent_session" DROP CONSTRAINT "FK_af6e9d82bc657109fa57d511623"`,
    )
    await queryRunner.query(`ALTER TABLE "conversation_agent_session" DROP COLUMN "campaign_id"`)
    await queryRunner.query(`ALTER TABLE "form_agent_session" DROP COLUMN "campaign_id"`)
    await queryRunner.query(`ALTER TABLE "extraction_agent_session" DROP COLUMN "campaign_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_79abb17828bae2c3956f1f8c19"`)
    await queryRunner.query(`DROP TABLE "review_campaign"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_651ca5c24d9213be0551b9a12f"`)
    await queryRunner.query(`DROP TABLE "tester_session_feedback"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_07ac47be13ab20357076efb8a1"`)
    await queryRunner.query(`DROP TABLE "tester_campaign_survey"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_004f4d617fd73f842c94265892"`)
    await queryRunner.query(`DROP TABLE "review_campaign_membership"`)
  }
}
