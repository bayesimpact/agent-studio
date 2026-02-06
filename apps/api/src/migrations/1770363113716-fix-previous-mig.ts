import type { MigrationInterface, QueryRunner } from "typeorm"

export class FixPreviousMig1770363113716 implements MigrationInterface {
  name = "FixPreviousMig1770363113716"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_c325e136d171c01945a68ec75b5"`)
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0"`)
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_c325e136d171c01945a68ec75b5" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
