import { type MigrationInterface, type QueryRunner, TableColumn } from "typeorm"

export class ExtendChatBots1769434441192 implements MigrationInterface {
  name = "ExtendChatBots1769434441192"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add model column
    await queryRunner.addColumn(
      "chat_bot",
      new TableColumn({
        name: "model",
        type: "varchar",
        isNullable: false,
        default: "'gemini-2.5-flash'",
      }),
    )

    // Add temperature column
    await queryRunner.addColumn(
      "chat_bot",
      new TableColumn({
        name: "temperature",
        type: "decimal",
        precision: 3,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    )

    // Add locale column
    await queryRunner.addColumn(
      "chat_bot",
      new TableColumn({
        name: "locale",
        type: "varchar",
        isNullable: false,
        default: "'en'",
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn("chat_bot", "locale")
    await queryRunner.dropColumn("chat_bot", "temperature")
    await queryRunner.dropColumn("chat_bot", "model")
  }
}
