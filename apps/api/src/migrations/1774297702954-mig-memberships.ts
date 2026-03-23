import type { MigrationInterface, QueryRunner } from "typeorm"

export class MigMemberships1774297702954 implements MigrationInterface {
  name = "MigMemberships1774297702954"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert project memberships for every (user, project) pair derived from org membership
    await queryRunner.query(`
      INSERT INTO "project_membership" ("id", "project_id", "user_id", "role", "invitation_token", "status", "created_at", "updated_at")
      SELECT
        gen_random_uuid(),
        p."id",
        om."user_id",
        om."role",
        gen_random_uuid(),
        'accepted',
        NOW(),
        NOW()
      FROM "organization_membership" om
      INNER JOIN "project" p ON p."organization_id" = om."organization_id"
      ON CONFLICT ("project_id", "user_id") DO UPDATE SET "role" = EXCLUDED."role"
    `)

    // Insert agent memberships for every (user, agent) pair derived from org membership
    await queryRunner.query(`
      INSERT INTO "agent_membership" ("id", "agent_id", "user_id", "role", "invitation_token", "status", "created_at", "updated_at")
      SELECT
        gen_random_uuid(),
        a."id",
        om."user_id",
        om."role",
        gen_random_uuid(),
        'accepted',
        NOW(),
        NOW()
      FROM "organization_membership" om
      INNER JOIN "project" p ON p."organization_id" = om."organization_id"
      INNER JOIN "agent" a ON a."project_id" = p."id"
      ON CONFLICT ("agent_id", "user_id") DO UPDATE SET "role" = EXCLUDED."role"
    `)
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
