import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddAgentMessageFeedback1770644851340 implements MigrationInterface {
  name = "AddAgentMessageFeedback1770644851340"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent_message_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "agent_message_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" character varying NOT NULL, CONSTRAINT "PK_2db113b8df3084cd4fd108fde88" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" ADD CONSTRAINT "FK_2319526fc0d16924a80308d137d" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" ADD CONSTRAINT "FK_c26bc07c159b835e04f83a17996" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" ADD CONSTRAINT "FK_ab9eb1359349b1750c55cf44144" FOREIGN KEY ("agent_message_id") REFERENCES "agent_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" ADD CONSTRAINT "FK_74f3784d4ac85fcac288ca2d445" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" DROP CONSTRAINT "FK_74f3784d4ac85fcac288ca2d445"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" DROP CONSTRAINT "FK_ab9eb1359349b1750c55cf44144"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" DROP CONSTRAINT "FK_c26bc07c159b835e04f83a17996"`,
    )
    await queryRunner.query(
      `ALTER TABLE "agent_message_feedback" DROP CONSTRAINT "FK_2319526fc0d16924a80308d137d"`,
    )
    await queryRunner.query(`DROP TABLE "agent_message_feedback"`)
  }
}
