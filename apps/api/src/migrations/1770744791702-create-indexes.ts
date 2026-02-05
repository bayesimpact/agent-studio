import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateIndexes1770744791702 implements MigrationInterface {
  name = "CreateIndexes1770744791702"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_0332fa8c55e110c3f30b06f474" ON "document" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9dd8d0b1892d6a5566649bd5bf" ON "agent" ("organization_id", "project_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_dac9fbe27ea12f874265977464" ON "agent_message" ("organization_id", "project_id", "session_id", "created_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e4982b00266176d12542e0226e" ON "agent_session" ("organization_id", "project_id", "agent_id", "type") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_e4982b00266176d12542e0226e"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_dac9fbe27ea12f874265977464"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9dd8d0b1892d6a5566649bd5bf"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_0332fa8c55e110c3f30b06f474"`)
  }
}
