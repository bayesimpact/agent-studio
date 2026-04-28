import type { MigrationInterface, QueryRunner } from "typeorm"

export class ReviewerSessionReview1777028119614 implements MigrationInterface {
  name = "ReviewerSessionReview1777028119614"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reviewer_session_review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "session_id" uuid NOT NULL, "session_type" character varying NOT NULL, "reviewer_user_id" uuid NOT NULL, "overall_rating" smallint NOT NULL, "comment" text, "answers" jsonb NOT NULL, "submitted_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_f94d57e005c9d6980ec61526959" UNIQUE ("session_id", "reviewer_user_id"), CONSTRAINT "PK_f17ac584ab9e24c6e65d276c35b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4e920cbeef5f14c3a858c38f4d" ON "reviewer_session_review" ("organization_id", "project_id", "campaign_id", "session_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "reviewer_session_review" ADD CONSTRAINT "FK_c3dd9b89588cbe8951f9747b39a" FOREIGN KEY ("campaign_id") REFERENCES "review_campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "reviewer_session_review" ADD CONSTRAINT "FK_dc143d020286c1297a88fa1030c" FOREIGN KEY ("reviewer_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviewer_session_review" DROP CONSTRAINT "FK_dc143d020286c1297a88fa1030c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "reviewer_session_review" DROP CONSTRAINT "FK_c3dd9b89588cbe8951f9747b39a"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_4e920cbeef5f14c3a858c38f4d"`)
    await queryRunner.query(`DROP TABLE "reviewer_session_review"`)
  }
}
