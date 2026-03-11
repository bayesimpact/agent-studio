import type { MigrationInterface, QueryRunner } from "typeorm"

export class DocTagDropFK1773242299259 implements MigrationInterface {
  name = "DocTagDropFK1773242299259"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_tag" DROP CONSTRAINT IF EXISTS "FK_ded43c7c8b73cc1423fe53f2a96"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_tag" ADD CONSTRAINT "FK_ded43c7c8b73cc1423fe53f2a96" FOREIGN KEY ("parent_id") REFERENCES "document_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
