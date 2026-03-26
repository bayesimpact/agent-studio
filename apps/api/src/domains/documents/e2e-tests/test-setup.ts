import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { Document } from "../document.entity"
import { DocumentsController } from "../documents.controller"
import { DocumentsModule } from "../documents.module"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "../storage/file-storage.interface"
import { withDocumentEmbeddingsBatchServiceMock } from "../test-overrides"

export function documentsControllerTestSetup() {
  let controller: DocumentsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let organizationMembershipRepository: Repository<OrganizationMembership>
  let projectRepository: Repository<Project>
  let documentRepository: Repository<Document>
  let fileStorageService: IFileStorage
  let organization: Organization

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: withDocumentEmbeddingsBatchServiceMock,
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<DocumentsController>(DocumentsController)
    fileStorageService = setup.module.get<IFileStorage>(FILE_STORAGE_SERVICE)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    organizationMembershipRepository = setup.getRepository(OrganizationMembership)
    projectRepository = setup.getRepository(Project)
    documentRepository = setup.getRepository(Document)

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
      organizationMembershipRepository,
      projectRepository,
      documentRepository,
      fileStorageService,
      controller,
      organization,
    }
  }
}
