import type { MigrationInterface, QueryRunner } from "typeorm"

export class SetOrganizationIdAndProjectId1770736967170 implements MigrationInterface {
  name = "SetOrganizationIdAndProjectId1770736967170"

  public async up(queryRunner: QueryRunner): Promise<void> {
    //set project_id
    await queryRunner.query(`
      UPDATE agent_session s
      SET "project_id" = a."project_id"
      FROM agent a
      WHERE s."agent_id" = a.id;
    `)
    await queryRunner.query(`
      UPDATE agent_message am
      SET "project_id" = s."project_id"
      FROM agent_session s
      WHERE am."session_id" = s.id;
    `)

    //set organization_id
    await queryRunner.query(`
      UPDATE document d
      SET "organization_id" = p."organization_id"
      FROM project p
      WHERE d."project_id" = p.id;
    `)
    await queryRunner.query(`
      UPDATE agent a
      SET "organization_id" = p."organization_id"
      FROM project p
      WHERE a."project_id" = p.id;
    `)
    await queryRunner.query(`
      UPDATE agent_message am
      SET "organization_id" = p."organization_id"
      FROM project p
      WHERE am."project_id" = p.id;
    `)
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
