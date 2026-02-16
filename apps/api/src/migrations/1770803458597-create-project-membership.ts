import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateProjectMembership1770803458597 implements MigrationInterface {
  name = "CreateProjectMembership1770803458597"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "invitation_token" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'sent', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0039028cc37537f2214a33d0ae6" UNIQUE ("invitation_token"), CONSTRAINT "UQ_9366a3b00e301e49b3a14530d5c" UNIQUE ("project_id", "user_id"), CONSTRAINT "PK_014d8d8717bd042113ffac67159" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_membership" ADD CONSTRAINT "FK_1e77d1ede201b6bb9549c2c97c3" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_membership" ADD CONSTRAINT "FK_ea6a0496325696009e4a392e1b1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_membership" DROP CONSTRAINT "FK_ea6a0496325696009e4a392e1b1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_membership" DROP CONSTRAINT "FK_1e77d1ede201b6bb9549c2c97c3"`,
    )
    await queryRunner.query(`DROP TABLE "project_membership"`)
  }
}
