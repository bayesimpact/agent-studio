import type { MigrationInterface, QueryRunner } from "typeorm"

export class HandleFK1772637724780 implements MigrationInterface {
  name = "HandleFK1772637724780"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // agent_message.session_id is a polymorphic FK that can reference either
    // conversation_agent_session or form_agent_session, so DB-level FK
    // constraints cannot be enforced. Drop any existing constraints.
    for (const constraint of [
      "FK_ce1742d31c9cd90c6089b10245b",
      "FK_b7a77e2d38823eba3b3c06e0e57", // conversation_agent_session FK (TypeORM auto-generated)
    ]) {
      const [existing] = await queryRunner.query(
        `SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'`,
      )
      if (existing) {
        await queryRunner.query(`ALTER TABLE "agent_message" DROP CONSTRAINT "${constraint}"`)
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: we intentionally removed these constraints
  }
}
