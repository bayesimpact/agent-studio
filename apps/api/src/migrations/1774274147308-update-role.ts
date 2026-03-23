import type { MigrationInterface, QueryRunner } from "typeorm"

export class UpdateRole1774274147308 implements MigrationInterface {
  name = "UpdateRole1774274147308"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "FK_1e9b66eae483a290addd3d0d657"`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "FK_13c0b9b73e272c78393908bfe31"`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "UQ_ca24d6d1a91810c7decccf091c3"`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_membership" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
    )
    await queryRunner.query(
      `ALTER TABLE "project_membership" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'admin'`,
    )
    await queryRunner.query(`UPDATE "project_membership" SET "role" = 'admin'`)
    await queryRunner.query(`ALTER TABLE "project_membership" ALTER COLUMN "role" DROP DEFAULT`)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organization_membership" ADD CONSTRAINT "UQ_4c0dd6adaf8fc161026db004550" UNIQUE ("user_id", "organization_id");
      EXCEPTION WHEN duplicate_table THEN NULL; END $$
    `)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organization_membership" ADD CONSTRAINT "FK_8d5d2e1483a59e6c008e4ef9e28" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organization_membership" ADD CONSTRAINT "FK_9ca5d2cb892f7d4a8ff6eebd420" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "FK_9ca5d2cb892f7d4a8ff6eebd420"`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "FK_8d5d2e1483a59e6c008e4ef9e28"`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" DROP CONSTRAINT IF EXISTS "UQ_4c0dd6adaf8fc161026db004550"`,
    )
    await queryRunner.query(`ALTER TABLE "project_membership" DROP COLUMN "role"`)
    await queryRunner.query(`ALTER TABLE "project_membership" DROP COLUMN "deleted_at"`)
    await queryRunner.query(
      `ALTER TABLE "organization_membership" ADD CONSTRAINT "UQ_ca24d6d1a91810c7decccf091c3" UNIQUE ("user_id", "organization_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" ADD CONSTRAINT "FK_13c0b9b73e272c78393908bfe31" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "organization_membership" ADD CONSTRAINT "FK_1e9b66eae483a290addd3d0d657" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
