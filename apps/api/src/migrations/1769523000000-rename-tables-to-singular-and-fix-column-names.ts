import { type MigrationInterface, type QueryRunner, TableForeignKey } from "typeorm"

export class RenameTablesToSingularAndFixColumnNames1769523000000 implements MigrationInterface {
  name = "RenameTablesToSingularAndFixColumnNames1769523000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Rename auth0Id column to auth0_id in users table
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "auth0Id" TO "auth0_id"`)

    // Step 2: Rename users table to user
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "user"`)

    // Step 3: Rename organizations table to organization
    await queryRunner.query(`ALTER TABLE "organizations" RENAME TO "organization"`)

    // Step 4: Update foreign keys in user_memberships to reference new table names
    const userMembershipsTable = await queryRunner.getTable("user_memberships")
    if (userMembershipsTable) {
      // Drop existing foreign keys
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

      // Recreate foreign keys with new table names
      await queryRunner.createForeignKey(
        "user_memberships",
        new TableForeignKey({
          columnNames: ["user_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "user",
          onDelete: "CASCADE",
        }),
      )

      await queryRunner.createForeignKey(
        "user_memberships",
        new TableForeignKey({
          columnNames: ["organization_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "organization",
          onDelete: "CASCADE",
        }),
      )
    }

    // Step 5: Rename user_memberships table to user_membership
    await queryRunner.query(`ALTER TABLE "user_memberships" RENAME TO "user_membership"`)

    // Step 6: Update unique index name for user_membership
    await queryRunner.query(
      `ALTER INDEX "IDX_user_memberships_user_organization" RENAME TO "IDX_user_membership_user_organization"`,
    )

    // Step 7: Update foreign key in projects to reference organization
    const projectsTable = await queryRunner.getTable("projects")
    if (projectsTable) {
      const foreignKeyOrg = projectsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("organization_id") !== -1,
      )

      if (foreignKeyOrg) {
        await queryRunner.dropForeignKey("projects", foreignKeyOrg)
      }

      await queryRunner.createForeignKey(
        "projects",
        new TableForeignKey({
          columnNames: ["organization_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "organization",
          onDelete: "CASCADE",
        }),
      )
    }

    // Step 8: Rename projects table to project
    await queryRunner.query(`ALTER TABLE "projects" RENAME TO "project"`)

    // Step 9: Update foreign key in chat_bots to reference project
    const chatBotsTable = await queryRunner.getTable("chat_bots")
    if (chatBotsTable) {
      const foreignKeyProject = chatBotsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("project_id") !== -1,
      )

      if (foreignKeyProject) {
        await queryRunner.dropForeignKey("chat_bots", foreignKeyProject)
      }

      await queryRunner.createForeignKey(
        "chat_bots",
        new TableForeignKey({
          columnNames: ["project_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "project",
          onDelete: "CASCADE",
        }),
      )
    }

    // Step 10: Rename chat_bots table to chat_bot
    await queryRunner.query(`ALTER TABLE "chat_bots" RENAME TO "chat_bot"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order: rename tables back to plural

    // Step 10: Rename chat_bot back to chat_bots
    await queryRunner.query(`ALTER TABLE "chat_bot" RENAME TO "chat_bots"`)

    // Step 9: Update foreign key in chat_bots back to projects
    const chatBotsTable = await queryRunner.getTable("chat_bots")
    if (chatBotsTable) {
      const foreignKeyProject = chatBotsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("project_id") !== -1,
      )

      if (foreignKeyProject) {
        await queryRunner.dropForeignKey("chat_bots", foreignKeyProject)
      }

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

    // Step 8: Rename project back to projects
    await queryRunner.query(`ALTER TABLE "project" RENAME TO "projects"`)

    // Step 7: Update foreign key in projects back to organizations
    const projectsTable = await queryRunner.getTable("projects")
    if (projectsTable) {
      const foreignKeyOrg = projectsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("organization_id") !== -1,
      )

      if (foreignKeyOrg) {
        await queryRunner.dropForeignKey("projects", foreignKeyOrg)
      }

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

    // Step 6: Rename index back
    await queryRunner.query(
      `ALTER INDEX "IDX_user_membership_user_organization" RENAME TO "IDX_user_memberships_user_organization"`,
    )

    // Step 5: Rename user_membership back to user_memberships
    await queryRunner.query(`ALTER TABLE "user_membership" RENAME TO "user_memberships"`)

    // Step 4: Update foreign keys in user_memberships back to old table names
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

      await queryRunner.createForeignKey(
        "user_memberships",
        new TableForeignKey({
          columnNames: ["user_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "users",
          onDelete: "CASCADE",
        }),
      )

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

    // Step 3: Rename organization back to organizations
    await queryRunner.query(`ALTER TABLE "organization" RENAME TO "organizations"`)

    // Step 2: Rename user back to users
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "users"`)

    // Step 1: Rename auth0_id column back to auth0Id
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "auth0_id" TO "auth0Id"`)
  }
}
