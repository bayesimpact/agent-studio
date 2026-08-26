import type { MigrationInterface, QueryRunner } from "typeorm"

export class PublicSessionMetadataAndResult1785459554526 implements MigrationInterface {
  name = "PublicSessionMetadataAndResult1785459554526"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "public_agent_session_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "public_agent_session_id" uuid NOT NULL, "agent_session_category_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e51b603d7e18e4e97838e340667" UNIQUE ("public_agent_session_id", "agent_session_category_id"), CONSTRAINT "PK_46e73eee0fa70477a1cce1c9916" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`ALTER TABLE "public_agent_session" ADD "title" character varying`)
    await queryRunner.query(`ALTER TABLE "public_agent_session" ADD "result" jsonb`)
    await queryRunner.query(
      `ALTER TABLE "public_agent_session_category" ADD CONSTRAINT "FK_e827dbe04aefee5a7b2cf86bcd2" FOREIGN KEY ("public_agent_session_id") REFERENCES "public_agent_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "public_agent_session_category" ADD CONSTRAINT "FK_7e7378db9d466e359dd0357335f" FOREIGN KEY ("agent_session_category_id") REFERENCES "agent_session_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public_agent_session_category" DROP CONSTRAINT "FK_7e7378db9d466e359dd0357335f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "public_agent_session_category" DROP CONSTRAINT "FK_e827dbe04aefee5a7b2cf86bcd2"`,
    )
    await queryRunner.query(`ALTER TABLE "public_agent_session" DROP COLUMN "result"`)
    await queryRunner.query(`ALTER TABLE "public_agent_session" DROP COLUMN "title"`)
    await queryRunner.query(`DROP TABLE "public_agent_session_category"`)
  }
}
