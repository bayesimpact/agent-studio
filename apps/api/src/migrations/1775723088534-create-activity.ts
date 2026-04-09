import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateActivity1775723088534 implements MigrationInterface {
  name = "CreateActivity1775723088534"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid, "user_id" uuid NOT NULL, "action" character varying NOT NULL, "entity_id" uuid, "entity_type" character varying, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "activity"`)
  }
}
