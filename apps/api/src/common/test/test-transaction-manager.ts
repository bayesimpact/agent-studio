/**
 * SOLUTION: Override EntityManager provider to make ALL services transactional
 *
 * This is the "other method" - by overriding the EntityManager provider,
 * all repositories (and thus all services) automatically use the transaction.
 */

import type { DynamicModule, Provider, Type } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule, type TestingModuleBuilder } from "@nestjs/testing"
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm"
import type { ObjectLiteral, QueryRunner, Repository } from "typeorm"
import { DataSource, EntityManager } from "typeorm"
import { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { AgentMessageFeedback } from "@/domains/agents/shared/agent-session-messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { TEST_ENTITIES } from "./test-entities"

export interface TransactionalTestSetup {
  module: TestingModule
  dataSource: DataSource
  queryRunner: QueryRunner | null
  getRepository: <T extends ObjectLiteral>(entity: new () => T) => Repository<T>
  getAllRepositories: () => {
    agentMessageFeedbackRepository: Repository<AgentMessageFeedback>
    agentMessageRepository: Repository<AgentMessage>
    agentRepository: Repository<Agent>
    extractionAgentSessionRepository: Repository<ExtractionAgentSession>
    conversationAgentSessionRepository: Repository<ConversationAgentSession>
    documentRepository: Repository<Document>
    evaluationReportRepository: Repository<EvaluationReport>
    evaluationRepository: Repository<Evaluation>
    membershipRepository: Repository<UserMembership>
    organizationRepository: Repository<Organization>
    projectMembershipRepository: Repository<ProjectMembership>
    projectRepository: Repository<Project>
    userRepository: Repository<User>
  }
  startTransaction: () => Promise<void>
  rollbackTransaction: () => Promise<void>
}

/**
 * Sets up a test database with transaction support that works with services.
 *
 * The key insight: Override EntityManager provider to use transactional manager.
 * This makes ALL repositories (and thus services) automatically transactional.
 * All entities in TEST_ENTITIES are automatically registered.
 *
 * Usage:
 * ```typescript
 * let setup: TransactionalTestSetup
 *
 * beforeAll(async () => {
 *   setup = await setupTransactionalTestDatabase({
 *     providers: [UsersService],
 *   })
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
  params: CreateTestingModuleParams = {},
): Promise<TransactionalTestSetup> {
  const { providers = [], additionalImports = [] } = params
  const baseModule = await createBaseTestingModule(params).compile()

  const testDatabaseUrl = process.env.DATABASE_URL
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
        TypeOrmModule.forFeature(TEST_ENTITIES),
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
        // Override repository providers for all entities
        ...TEST_ENTITIES.map((entity) => ({
          provide: getRepositoryToken(entity),
          useFactory: (manager: EntityManager) => manager.getRepository(entity),
          inject: [EntityManager],
        })),
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

  const getAllRepositories = () => ({
    userRepository: getRepository(User),
    organizationRepository: getRepository(Organization),
    membershipRepository: getRepository(UserMembership),
    projectRepository: getRepository(Project),
    projectMembershipRepository: getRepository(ProjectMembership),
    agentRepository: getRepository(Agent),
    extractionAgentSessionRepository: getRepository(ExtractionAgentSession),
    conversationAgentSessionRepository: getRepository(ConversationAgentSession),
    agentMessageRepository: getRepository(AgentMessage),
    agentMessageFeedbackRepository: getRepository(AgentMessageFeedback),
    documentRepository: getRepository(Document),
    evaluationRepository: getRepository(Evaluation),
    evaluationReportRepository: getRepository(EvaluationReport),
  })

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
    getAllRepositories,
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

export function createBaseTestingModule({
  providers = [],
  additionalImports = [],
  applyOverrides,
}: CreateTestingModuleParams = {}) {
  const testDatabaseUrl = process.env.DATABASE_URL
  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL not found in environment. Make sure .env.test is loaded.")
  }

  // Create base module without transaction
  const baseModule = Test.createTestingModule({
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
      TypeOrmModule.forFeature(TEST_ENTITIES),
      ...additionalImports,
    ],
    providers,
  })

  return applyOverrides ? applyOverrides(baseModule) : baseModule
}

export type CreateTestingModuleParams = {
  providers?: Provider[]
  additionalImports?: Array<Type<unknown> | DynamicModule>
  applyOverrides?: (moduleBuilder: TestingModuleBuilder) => TestingModuleBuilder
}
