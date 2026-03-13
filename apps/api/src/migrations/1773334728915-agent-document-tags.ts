import type { MigrationInterface, QueryRunner } from "typeorm"

export class AgentDocumentTagsMig1773334728915 implements MigrationInterface {
  name = "AgentDocumentTags1773334728915"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_document_tag" ("agent_id" uuid NOT NULL, "document_tag_id" uuid NOT NULL, CONSTRAINT "PK_9c5180c78778b6db40c67d37291" PRIMARY KEY ("agent_id", "document_tag_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2ece601bf7b92be6ecc6882608" ON "agent_document_tag" ("agent_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_a83abd22e883be903bd793c469" ON "agent_document_tag" ("document_tag_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_document_tag" ADD CONSTRAINT "FK_2ece601bf7b92be6ecc6882608a" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_document_tag" ADD CONSTRAINT "FK_a83abd22e883be903bd793c469f" FOREIGN KEY ("document_tag_id") REFERENCES "document_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_document_tag" DROP CONSTRAINT "FK_a83abd22e883be903bd793c469f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_document_tag" DROP CONSTRAINT "FK_2ece601bf7b92be6ecc6882608a"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_a83abd22e883be903bd793c469"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_2ece601bf7b92be6ecc6882608"`)
    await queryRunner.query(`DROP TABLE "agent_document_tag"`)
  }
}
