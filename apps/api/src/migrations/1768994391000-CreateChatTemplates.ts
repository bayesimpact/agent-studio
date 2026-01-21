import { type MigrationInterface, type QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateChatTemplates1768994391000 implements MigrationInterface {
  name = "CreateChatTemplates1768994391000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_templates table
    await queryRunner.createTable(
      new Table({
        name: "chat_templates",
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

    // Create foreign key from chat_templates to projects
    await queryRunner.createForeignKey(
      "chat_templates",
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
    const chatTemplatesTable = await queryRunner.getTable("chat_templates")
    if (chatTemplatesTable) {
      const foreignKeyProject = chatTemplatesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("project_id") !== -1,
      )

      if (foreignKeyProject) {
        await queryRunner.dropForeignKey("chat_templates", foreignKeyProject)
      }
    }

    // Drop table
    await queryRunner.dropTable("chat_templates")
  }
}
