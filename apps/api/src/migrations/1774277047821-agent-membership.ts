import type { MigrationInterface, QueryRunner } from "typeorm"

export class AgentMembership1774277047821 implements MigrationInterface {
  name = "AgentMembership1774277047821"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "agent_id" uuid NOT NULL, "user_id" uuid NOT NULL, "invitation_token" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'sent', "role" character varying NOT NULL, CONSTRAINT "UQ_6c0da27f9f8263842f356925fd2" UNIQUE ("invitation_token"), CONSTRAINT "UQ_f7618358bb3b60fd738ca2b5e42" UNIQUE ("agent_id", "user_id"), CONSTRAINT "PK_a66c59fee3758d63876e7ddcf2e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_membership" ADD CONSTRAINT "FK_e415f784595fbf83bc86333fc89" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_membership" ADD CONSTRAINT "FK_e76a2ee3db93920baffaba09c08" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_membership" DROP CONSTRAINT "FK_e76a2ee3db93920baffaba09c08"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_membership" DROP CONSTRAINT "FK_e415f784595fbf83bc86333fc89"`,
    )
    await queryRunner.query(`DROP TABLE "agent_membership"`)
  }
}
