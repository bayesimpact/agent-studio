import { type MigrationInterface, type QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateProjects1768554615000 implements MigrationInterface {
  name = "CreateProjects1768554615000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create projects table
    await queryRunner.createTable(
      new Table({
        name: "projects",
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
            name: "organization_id",
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

    // Create foreign key from projects to organizations
    await queryRunner.createForeignKey(
      "projects",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "organizations",
        onDelete: "CASCADE",
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const projectsTable = await queryRunner.getTable("projects")
    if (projectsTable) {
      const foreignKeyOrg = projectsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("organization_id") !== -1,
      )

      if (foreignKeyOrg) {
        await queryRunner.dropForeignKey("projects", foreignKeyOrg)
      }
    }

    // Drop table
    await queryRunner.dropTable("projects")
  }
}
