import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm"

export class CreateUsersOrganizationsAndMemberships1734567890000 implements MigrationInterface {
  name = "CreateUsersOrganizationsAndMemberships1734567890000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid extension is enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: "users",
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
            name: "auth0Id",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "email",
            type: "varchar",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "picture_url",
            type: "varchar",
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

    // Create organizations table
    await queryRunner.createTable(
      new Table({
        name: "organizations",
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

    // Create user_memberships table
    await queryRunner.createTable(
      new Table({
        name: "user_memberships",
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
            name: "user_id",
            type: "uuid",
          },
          {
            name: "organization_id",
            type: "uuid",
          },
          {
            name: "role",
            type: "varchar",
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

    // Create unique constraint on (user_id, organization_id)
    await queryRunner.createIndex(
      "user_memberships",
      new TableIndex({
        name: "IDX_user_memberships_user_organization",
        columnNames: ["user_id", "organization_id"],
        isUnique: true,
      }),
    )

    // Create foreign key from user_memberships to users
    await queryRunner.createForeignKey(
      "user_memberships",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      }),
    )

    // Create foreign key from user_memberships to organizations
    await queryRunner.createForeignKey(
      "user_memberships",
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
    const userMembershipsTable = await queryRunner.getTable("user_memberships")
    if (userMembershipsTable) {
      const foreignKeyUser = userMembershipsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("user_id") !== -1,
      )
      const foreignKeyOrg = userMembershipsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("organization_id") !== -1,
      )

      if (foreignKeyUser) {
        await queryRunner.dropForeignKey("user_memberships", foreignKeyUser)
      }
      if (foreignKeyOrg) {
        await queryRunner.dropForeignKey("user_memberships", foreignKeyOrg)
      }
    }

    // Drop tables
    await queryRunner.dropTable("user_memberships")
    await queryRunner.dropTable("organizations")
    await queryRunner.dropTable("users")
  }
}
