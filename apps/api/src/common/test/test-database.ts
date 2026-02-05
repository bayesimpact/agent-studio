import { randomUUID } from "node:crypto"
import type { DynamicModule, Provider, Type } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm"
import {
  DataSource,
  type EntityManager,
  type ObjectLiteral,
  type QueryRunner,
  type Repository,
} from "typeorm"
import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { AgentMessage } from "@/domains/agent-sessions/agent-message.entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Agent } from "@/domains/agents/agent.entity"
import { Document } from "@/domains/documents/document.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

export const RandomUuid = {
  Organization: randomUUID(),
  Project: randomUUID(),
  Document: randomUUID(),
} as const

const TEST_ENTITIES = [
  User,
  Organization,
  UserMembership,
  Project,
  Agent,
  AgentSession,
  AgentMessage,
  AgentMessageFeedback,
  Document,
]

export interface TestDatabaseSetup {
  module: TestingModule
  dataSource: DataSource
  getRepository: <T extends ObjectLiteral>(entity: new () => T) => Repository<T>
  /**
   * Starts a transaction and returns a QueryRunner.
   * All repositories obtained via getRepository will use the transactional EntityManager.
   * Remember to call rollbackTransaction() and release() when done.
   */
  startTransaction: () => Promise<QueryRunner>
  /**
   * Gets a repository that uses the provided transactional EntityManager.
   */
  getRepositoryForTransaction: <T extends ObjectLiteral>(
    entity: new () => T,
    entityManager: EntityManager,
  ) => Repository<T>
}

/**
 * Sets up a test database connection with all entities.
 * Automatically handles cleanup in the returned object.
 */
export async function setupTestDatabase(
  providers: Provider[] = [],
  additionalImports: Array<Type<unknown> | DynamicModule> = [],
): Promise<TestDatabaseSetup> {
  const testDatabaseUrl = process.env.DATABASE_URL
  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL not found in environment. Make sure .env.test is loaded.")
  }

  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({
        type: "postgres",
        url: testDatabaseUrl,
        entities: TEST_ENTITIES,
        logging: false,
        dropSchema: false,
      }),
      TypeOrmModule.forFeature(TEST_ENTITIES),
      ...additionalImports,
    ],
    providers,
  }).compile()

  const dataSource = module.get<DataSource>(DataSource)

  const getRepository = <T extends ObjectLiteral>(entity: new () => T): Repository<T> => {
    return module.get<Repository<T>>(getRepositoryToken(entity))
  }

  const startTransaction = async (): Promise<QueryRunner> => {
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    return queryRunner
  }

  const getRepositoryForTransaction = <T extends ObjectLiteral>(
    entity: new () => T,
    entityManager: EntityManager,
  ): Repository<T> => {
    return entityManager.getRepository(entity)
  }

  return {
    module,
    dataSource,
    getRepository,
    startTransaction,
    getRepositoryForTransaction,
  }
}

/**
 * Clears all test data from the database.
 * Tables are cleared in the correct order to respect foreign key constraints.
 * Uses TRUNCATE CASCADE for faster and safer cleanup that respects foreign keys.
 */
export async function clearTestDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return
  }

  // Use a transaction to ensure atomic cleanup
  const queryRunner = dataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Delete in order: child tables first, then parent tables
      await queryRunner.query(`DELETE FROM "agent_message_feedback"`)
      await queryRunner.query(`DELETE FROM "agent_message"`)
      await queryRunner.query(`DELETE FROM "agent_session"`)
      await queryRunner.query(`DELETE FROM "user_membership"`)
      await queryRunner.query(`DELETE FROM "document"`)
      await queryRunner.query(`DELETE FROM "agent"`)
      await queryRunner.query(`DELETE FROM "project"`)
      await queryRunner.query(`DELETE FROM "organization"`)
      await queryRunner.query(`DELETE FROM "user"`)

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    }
  } finally {
    await queryRunner.release()
  }
}

/**
 * Cleans up test database connection.
 */
export async function teardownTestDatabase(setup: TestDatabaseSetup): Promise<void> {
  await clearTestDatabase(setup.dataSource)
  await setup.dataSource.destroy()
  await setup.module.close()
}
