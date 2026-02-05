import type { MigrationInterface, QueryRunner } from "typeorm"

export class DropIndexes1770736967168 implements MigrationInterface {
  name = "DropIndexes1770736967168"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_3ff393a5fa21f526cc370539e1"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d0e43de088b014d8899fff6692"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_e581f8875b2c8bad9ca4dc697a"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bfe74fcb5f049ec7ba5c7ec5e4"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_bfe74fcb5f049ec7ba5c7ec5e4" ON "agent_session" ("organization_id", "type") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e581f8875b2c8bad9ca4dc697a" ON "agent_session" ("agent_id", "type") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_d0e43de088b014d8899fff6692" ON "agent_session" ("expires_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3ff393a5fa21f526cc370539e1" ON "agent_message" ("created_at", "session_id") `,
    )
  }
}
