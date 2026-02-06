import type { MigrationInterface, QueryRunner } from "typeorm"

export class CleanAgentTables1770313934213 implements MigrationInterface {
  name = "CleanAgentTables1770313934213"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_c325e136d171c01945a68ec75b5"`)
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_f9734643b9475716317c7b0c75c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_0e1d53a7228a9b05d5c670f345"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bc547a549096fefa1cb725bb67"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_d0e43de088b014d8899fff6692" ON "agent_session" ("expires_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_bfe74fcb5f049ec7ba5c7ec5e4" ON "agent_session" ("organization_id", "type") `,
    )
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_152a42ea0dc5fe04a227a16611e" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_0b498e8a40fa9f8314d70ffee68" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_29ea25d342123db9debf79caa7e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_29ea25d342123db9debf79caa7e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_0b498e8a40fa9f8314d70ffee68"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" DROP CONSTRAINT "FK_152a42ea0dc5fe04a227a16611e"`,
    )
    await queryRunner.query(`ALTER TABLE "agent" DROP CONSTRAINT "FK_48cb7e253c9f0cbaca40bf98da0"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bfe74fcb5f049ec7ba5c7ec5e4"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d0e43de088b014d8899fff6692"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_bc547a549096fefa1cb725bb67" ON "agent_session" ("organization_id", "type") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0e1d53a7228a9b05d5c670f345" ON "agent_session" ("expires_at") `,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_fd74d9ebaae863a18155d2d3753" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_f9734643b9475716317c7b0c75c" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_session" ADD CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent" ADD CONSTRAINT "FK_c325e136d171c01945a68ec75b5" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
