import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Review campaigns now run on the settings revision they are pinned to
 * (TesterService.getAgentForCampaign). Rows created before that used a placeholder
 * pin of revision 1, so re-pin every campaign to its agent's latest published
 * revision: that is the revision they were effectively running on until now.
 */
export class RepinReviewCampaignAgentSettings1785928420530 implements MigrationInterface {
  name = "RepinReviewCampaignAgentSettings1785928420530"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "review_campaign" AS "rc"
      SET "agent_settings_id" = "latest"."id"
      FROM (
        SELECT DISTINCT ON ("agent_id") "id", "agent_id"
        FROM "agent_settings"
        WHERE "is_draft" = false AND "is_archived" = false AND "deleted_at" IS NULL
        ORDER BY "agent_id", "revision" DESC
      ) AS "latest"
      WHERE "latest"."agent_id" = "rc"."agent_id"
    `)
  }

  public async down(): Promise<void> {
    // Deliberately empty: the previous values were a placeholder (revision 1), so
    // restoring them would re-introduce the bug this migration fixes.
  }
}
