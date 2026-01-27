import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm"

export class CreateChatSessions1769434441191 implements MigrationInterface {
  name = "CreateChatSessions1769434441191"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_session table
    await queryRunner.createTable(
      new Table({
        name: "chat_session",
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
            name: "chatbot_id",
            type: "uuid",
          },
          {
            name: "user_id",
            type: "uuid",
          },
          {
            name: "organization_id",
            type: "uuid",
          },
          {
            name: "type",
            type: "varchar",
          },
          {
            name: "messages",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: true,
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

    // Add CHECK constraint for type column
    await queryRunner.query(
      `ALTER TABLE "chat_session" ADD CONSTRAINT "CHK_chat_session_type" CHECK (type IN ('playground', 'production'))`,
    )

    // Create indexes
    await queryRunner.createIndex(
      "chat_session",
      new TableIndex({
        name: "IDX_chat_session_chatbot_type",
        columnNames: ["chatbot_id", "type"],
      }),
    )

    await queryRunner.createIndex(
      "chat_session",
      new TableIndex({
        name: "IDX_chat_session_organization_type",
        columnNames: ["organization_id", "type"],
      }),
    )

    await queryRunner.createIndex(
      "chat_session",
      new TableIndex({
        name: "IDX_chat_session_expires_at",
        columnNames: ["expires_at"],
      }),
    )

    // Create foreign key from chat_session to chat_bots
    await queryRunner.createForeignKey(
      "chat_session",
      new TableForeignKey({
        columnNames: ["chatbot_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "chat_bots",
        onDelete: "CASCADE",
      }),
    )

    // Create foreign key from chat_session to users
    await queryRunner.createForeignKey(
      "chat_session",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      }),
    )

    // Create foreign key from chat_session to organizations
    await queryRunner.createForeignKey(
      "chat_session",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "organizations",
        onDelete: "CASCADE",
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const chatSessionsTable = await queryRunner.getTable("chat_session")
    if (chatSessionsTable) {
      const foreignKeyChatBot = chatSessionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("chatbot_id") !== -1,
      )
      const foreignKeyUser = chatSessionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("user_id") !== -1,
      )
      const foreignKeyOrg = chatSessionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("organization_id") !== -1,
      )

      if (foreignKeyChatBot) {
        await queryRunner.dropForeignKey("chat_session", foreignKeyChatBot)
      }
      if (foreignKeyUser) {
        await queryRunner.dropForeignKey("chat_session", foreignKeyUser)
      }
      if (foreignKeyOrg) {
        await queryRunner.dropForeignKey("chat_session", foreignKeyOrg)
      }
    }

    // Drop CHECK constraint
    await queryRunner.query(
      `ALTER TABLE "chat_session" DROP CONSTRAINT IF EXISTS "CHK_chat_session_type"`,
    )

    // Drop indexes
    await queryRunner.dropIndex("chat_session", "IDX_chat_session_chatbot_type")
    await queryRunner.dropIndex("chat_session", "IDX_chat_session_organization_type")
    await queryRunner.dropIndex("chat_session", "IDX_chat_session_expires_at")

    // Drop table
    await queryRunner.dropTable("chat_session")
  }
}
