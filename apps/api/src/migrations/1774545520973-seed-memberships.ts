import type { MigrationInterface, QueryRunner } from "typeorm"

export class SeedMemberships1774545520973 implements MigrationInterface {
  name = "SeedMemberships1774545520973"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Current org owner -> admin in organization_membership
    await queryRunner.query(`
      UPDATE organization_membership
      SET role = 'admin'
      WHERE role = 'owner'
    `)

    // 2. Current project invited -> set project_membership role to 'member'
    await queryRunner.query(`
      UPDATE project_membership
      SET role = 'member'
    `)

    // 3. Every org admin -> for all projects in their org, insert project_membership as admin
    await queryRunner.query(`
      INSERT INTO project_membership (id, project_id, user_id, invitation_token, status, role, created_at, updated_at)
      SELECT uuid_generate_v4(), p.id, om.user_id, 'seed_membership-' || uuid_generate_v4()::varchar, 'accepted', 'admin', NOW(), NOW()
      FROM organization_membership om
      JOIN project p ON p.organization_id = om.organization_id
      WHERE om.role = 'admin'
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ON CONFLICT ("project_id", "user_id") DO UPDATE SET role = 'admin'
    `)

    // 4. Current project members -> for all agents in their projects, insert agent_membership as member
    await queryRunner.query(`
      INSERT INTO agent_membership (id, agent_id, user_id, invitation_token, status, role, created_at, updated_at)
      SELECT uuid_generate_v4(), a.id, pm.user_id, 'seed_membership-' || uuid_generate_v4()::varchar, 'accepted', 'member', NOW(), NOW()
      FROM project_membership pm
      JOIN agent a ON a.project_id = pm.project_id
      WHERE pm.role = 'member'
        AND pm.deleted_at IS NULL
        AND a.deleted_at IS NULL
      ON CONFLICT ("agent_id", "user_id") DO NOTHING
    `)

    // 5. Every org admin -> for all agents in all projects, insert agent_membership as admin
    await queryRunner.query(`
      INSERT INTO agent_membership (id, agent_id, user_id, invitation_token, status, role, created_at, updated_at)
      SELECT uuid_generate_v4(), a.id, om.user_id, 'seed_membership-' || uuid_generate_v4()::varchar, 'accepted', 'admin', NOW(), NOW()
      FROM organization_membership om
      JOIN project p ON p.organization_id = om.organization_id
      JOIN agent a ON a.project_id = p.id
      WHERE om.role = 'admin'
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND a.deleted_at IS NULL
      ON CONFLICT ("agent_id", "user_id") DO UPDATE SET role = 'admin'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all agent memberships seeded by this migration
    await queryRunner.query(`DELETE FROM agent_membership`)

    // Remove project memberships created for org admins (those with role = 'admin')
    await queryRunner.query(`
      DELETE FROM project_membership
      WHERE role = 'admin'
        AND user_id IN (
          SELECT user_id FROM organization_membership WHERE role = 'admin'
        )
    `)

    // Revert org admins that were originally owners back to owner
    await queryRunner.query(`
      UPDATE organization_membership
      SET role = 'owner'
      WHERE role = 'admin'
    `)
  }
}
