import type { MigrationInterface, QueryRunner } from "typeorm"

export class AlterOrganizationIdAndProjectIdNotNullable1770743910509 implements MigrationInterface {
  name = "AlterOrganizationIdAndProjectIdNotNullable1770743910509"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea"`,
    )
    await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "organization_id" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "project_id" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0"`)
    await queryRunner.query(`ALTER TABLE "agent" ALTER COLUMN "organization_id" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "agent" ALTER COLUMN "project_id" SET NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ALTER COLUMN "organization_id" SET NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" ALTER COLUMN "project_id" SET NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_29ea25d342123db9debf79caa7e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ALTER COLUMN "organization_id" SET NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "agent_session" ALTER COLUMN "project_id" SET NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_29ea25d342123db9debf79caa7e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_29ea25d342123db9debf79caa7e"`,
    )
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0"`)
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea"`,
    )
    await queryRunner.query(`ALTER TABLE "agent_session" ALTER COLUMN "project_id" DROP NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "agent_session" ALTER COLUMN "organization_id" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_29ea25d342123db9debf79caa7e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`ALTER TABLE "agent_message" ALTER COLUMN "project_id" DROP NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "agent_message" ALTER COLUMN "organization_id" DROP NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "agent" ALTER COLUMN "project_id" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "agent" ALTER COLUMN "organization_id" DROP NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "project_id" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "organization_id" DROP NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_4d4739c863ab05b56a8eabd15ea" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
