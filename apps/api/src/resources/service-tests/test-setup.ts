import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"
import { Resource } from "../resource.entity"
import { ResourcesModule } from "../resources.module"
import { ResourcesService } from "../resources.service"

export function resourcesServiceTestSetup() {
  let service: ResourcesService
  let resourceRepository: Repository<Resource>
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ResourcesModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<ResourcesService>(ResourcesService)
    resourceRepository = setup.getRepository(Resource)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  return () => {
    return {
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
      resourceRepository,
      service,
    }
  }
}
