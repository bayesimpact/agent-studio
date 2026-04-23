import type { MigrationInterface, QueryRunner } from "typeorm"

export class ReviewCampaignMembershipInvitationToken1776957441586 implements MigrationInterface {
  name = "ReviewCampaignMembershipInvitationToken1776957441586"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" ADD "invitation_token" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "review_campaign_membership" DROP COLUMN "invitation_token"`,
    )
  }
}
