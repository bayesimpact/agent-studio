import type { Provider } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm"
import { DataSource, type ObjectLiteral, type Repository } from "typeorm"
import { Organization } from "@/organizations/organization.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"

const TEST_ENTITIES = [User, Organization, UserMembership]

export interface TestDatabaseSetup {
  module: TestingModule
  dataSource: DataSource
  getRepository: <T extends ObjectLiteral>(entity: new () => T) => Repository<T>
}

/**
 * Sets up a test database connection with all entities.
 * Automatically handles cleanup in the returned object.
 */
export async function setupTestDatabase(
  featureEntities: Array<new () => ObjectLiteral>,
  providers: Provider[] = [],
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
        synchronize: true,
        logging: false,
        dropSchema: false,
      }),
      TypeOrmModule.forFeature(featureEntities),
    ],
    providers,
  }).compile()

  const dataSource = module.get<DataSource>(DataSource)

  const getRepository = <T extends ObjectLiteral>(entity: new () => T): Repository<T> => {
    return module.get<Repository<T>>(getRepositoryToken(entity))
  }

  return {
    module,
    dataSource,
    getRepository,
  }
}

/**
 * Clears all test data from the database.
 * Tables are cleared in the correct order to respect foreign key constraints.
 */
export async function clearTestDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return
  }
  await dataSource.getRepository(UserMembership).createQueryBuilder().delete().execute()
  await dataSource.getRepository(Organization).createQueryBuilder().delete().execute()
  await dataSource.getRepository(User).createQueryBuilder().delete().execute()
}

/**
 * Cleans up test database connection.
 */
export async function teardownTestDatabase(setup: TestDatabaseSetup): Promise<void> {
  await clearTestDatabase(setup.dataSource)
  await setup.dataSource.destroy()
  await setup.module.close()
}
