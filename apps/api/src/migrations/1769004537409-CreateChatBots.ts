import { type MigrationInterface, type QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateChatBots1769004537409 implements MigrationInterface {
  name = "CreateChatBots1769004537409"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_bots table
    await queryRunner.createTable(
      new Table({
        name: "chat_bots",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "default_prompt",
            type: "text",
          },
          {
            name: "project_id",
            type: "uuid",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    )

    // Create foreign key from chat_bots to projects
    await queryRunner.createForeignKey(
      "chat_bots",
      new TableForeignKey({
        columnNames: ["project_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "projects",
        onDelete: "CASCADE",
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const chatBotsTable = await queryRunner.getTable("chat_bots")
    if (chatBotsTable) {
      const foreignKeyProject = chatBotsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("project_id") !== -1,
      )

      if (foreignKeyProject) {
        await queryRunner.dropForeignKey("chat_bots", foreignKeyProject)
      }
    }

    // Drop table
    await queryRunner.dropTable("chat_bots")
  }
}
