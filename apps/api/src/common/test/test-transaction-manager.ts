/**
 * SOLUTION: Override EntityManager provider to make ALL services transactional
 *
 * This is the "other method" - by overriding the EntityManager provider,
 * all repositories (and thus all services) automatically use the transaction.
 */

import type { DynamicModule, Provider, Type } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm"
import type { ObjectLiteral, QueryRunner, Repository } from "typeorm"
import { DataSource, EntityManager } from "typeorm"
import { Organization } from "@/organizations/organization.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"

const TEST_ENTITIES = [User, Organization, UserMembership, Project]

export interface TransactionalTestSetup {
  module: TestingModule
  dataSource: DataSource
  queryRunner: QueryRunner | null
  getRepository: <T extends ObjectLiteral>(entity: new () => T) => Repository<T>
  startTransaction: () => Promise<void>
  rollbackTransaction: () => Promise<void>
}

/**
 * Sets up a test database with transaction support that works with services.
 *
 * The key insight: Override EntityManager provider to use transactional manager.
 * This makes ALL repositories (and thus services) automatically transactional.
 *
 * Usage:
 * ```typescript
 * let setup: TransactionalTestSetup
 *
 * beforeAll(async () => {
 *   setup = await setupTransactionalTestDatabase([User], [UsersService])
 *   // Optionally clear database once at the start for clean state
 *   await clearTestDatabase(setup.dataSource)
 * })
 *
 * beforeEach(async () => {
 *   await setup.startTransaction()
 * })
 *
 * afterEach(async () => {
 *   await setup.rollbackTransaction()
 * })
 *
 * it("should work with services", async () => {
 *   const service = setup.module.get(UsersService)
 *   // Service automatically uses transactional repository!
 *   const user = await service.findByAuth0Id("auth0|123")
 * })
 * ```
 */
export async function setupTransactionalTestDatabase(
  featureEntities: Array<new () => ObjectLiteral>,
  providers: Provider[] = [],
  additionalImports: Array<Type<unknown> | DynamicModule> = [],
): Promise<TransactionalTestSetup> {
  const testDatabaseUrl = process.env.DATABASE_URL
  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL not found in environment. Make sure .env.test is loaded.")
  }

  // Create base module without transaction
  const baseModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({
        type: "postgres",
        url: testDatabaseUrl,
        entities: TEST_ENTITIES,
        synchronize: true,
        logging: false,
        dropSchema: false,
      }),
      TypeOrmModule.forFeature(featureEntities),
      ...additionalImports,
    ],
    providers,
  }).compile()

  const dataSource = baseModule.get<DataSource>(DataSource)
  let queryRunner: QueryRunner | null = null
  let transactionalModule: TestingModule = baseModule

  const startTransaction = async (): Promise<void> => {
    if (queryRunner) {
      // If transaction already exists, rollback first
      await rollbackTransaction()
    }

    queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    // Use READ COMMITTED isolation level for test isolation
    // Note: While READ COMMITTED prevents "dirty reads" (queries seeing uncommitted data),
    // PostgreSQL's unique constraint checks DO see uncommitted inserts from other transactions.
    // This means if two parallel tests try to insert the same unique value, one will fail
    // with a constraint violation even though both are in separate transactions.
    // Solution: Each test file uses unique identifier prefixes to avoid conflicts.
    await queryRunner.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await queryRunner.startTransaction()

    // Note: We do NOT clear the database here. Transaction rollback in afterEach
    // will automatically clean up all changes made during the test, providing proper isolation.
    // This avoids foreign key constraint issues and works correctly with parallel test execution.

    // Create a new module with overridden providers for this transaction
    // This is the "other method" - recreate module with transactional providers
    const moduleBuilder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: "postgres",
          url: testDatabaseUrl,
          entities: TEST_ENTITIES,
          synchronize: true,
          logging: false,
          dropSchema: false,
        }),
        TypeOrmModule.forFeature(featureEntities),
        ...additionalImports,
      ],
      providers: [
        ...providers,
        // Override EntityManager to use transactional manager
        // This ensures ALL repositories (including from imported modules) use the transaction
        {
          provide: EntityManager,
          useValue: queryRunner.manager,
        },
        // Override repository providers for explicitly listed entities
        // IMPORTANT: We also override EntityManager above, so repositories from imported
        // modules (like UsersModule) will automatically use the transactional EntityManager
        // when they inject EntityManager in their TypeOrmModule.forFeature() providers
        ...featureEntities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useFactory: (manager: EntityManager) => manager.getRepository(entity),
          inject: [EntityManager],
        })),
        // Also override repositories for TEST_ENTITIES to catch all possible entities
        // that might be used by imported modules
        ...TEST_ENTITIES.filter((entity) => !featureEntities.some((fe) => fe === entity)).map(
          (entity) => ({
            provide: getRepositoryToken(entity),
            useFactory: (manager: EntityManager) => manager.getRepository(entity),
            inject: [EntityManager],
          }),
        ),
      ],
    })

    transactionalModule = await moduleBuilder.compile()
  }

  const rollbackTransaction = async (): Promise<void> => {
    if (!queryRunner) {
      return
    }

    // Close transactional module first to release resources
    if (transactionalModule !== baseModule) {
      try {
        await transactionalModule.close()
      } catch (error) {
        console.warn("Error closing transactional module:", error)
      }
      transactionalModule = baseModule
    }

    try {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
    } catch (error) {
      // Ignore rollback errors
      console.warn("Error during rollback:", error)
    } finally {
      try {
        await queryRunner.release()
      } catch (error) {
        console.warn("Error releasing query runner:", error)
      }
      queryRunner = null
    }
  }

  const getRepository = <T extends ObjectLiteral>(entity: new () => T): Repository<T> => {
    // Use transactional module if transaction is active, otherwise base module
    const moduleToUse = queryRunner ? transactionalModule : baseModule
    return moduleToUse.get<Repository<T>>(getRepositoryToken(entity))
  }

  return {
    get module() {
      // Return transactional module if transaction is active, otherwise base
      return queryRunner ? transactionalModule : baseModule
    },
    dataSource,
    get queryRunner() {
      return queryRunner
    },
    getRepository,
    startTransaction,
    rollbackTransaction,
  }
}

/**
 * Cleans up transactional test database connection.
 */
export async function teardownTestDatabase(setup: TransactionalTestSetup): Promise<void> {
  if (setup.queryRunner) {
    await setup.rollbackTransaction()
  }
  await setup.dataSource.destroy()
  await setup.module.close()
}
