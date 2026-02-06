import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"
import { Resource } from "../resource.entity"
import { ResourcesController } from "../resources.controller"
import { ResourcesModule } from "../resources.module"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "../storage/file-storage.interface"

export function resourcesControllerTestSetup() {
  let controller: ResourcesController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let resourceRepository: Repository<Resource>
  let fileStorageService: IFileStorage
  let organization: Organization

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
    controller = setup.module.get<ResourcesController>(ResourcesController)
    fileStorageService = setup.module.get<IFileStorage>(FILE_STORAGE_SERVICE)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    resourceRepository = setup.getRepository(Resource)

    const org = organizationFactory.build({ name: "Org1" })
    organization = await organizationRepository.save(org)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
    await clearTestDatabase(setup.dataSource)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  return () => {
    return {
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
      resourceRepository,
      fileStorageService,
      controller,
      organization,
    }
  }
}
