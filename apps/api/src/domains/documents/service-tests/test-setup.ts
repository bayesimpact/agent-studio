import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { Document } from "../document.entity"
import { DocumentsModule } from "../documents.module"
import { DocumentsService } from "../documents.service"
import { withDocumentEmbeddingsBatchServiceMock } from "../test-overrides"

export function documentsServiceTestSetup() {
  let service: DocumentsService
  let documentRepository: Repository<Document>
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<OrganizationMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

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
    service = setup.module.get<DocumentsService>(DocumentsService)
    documentRepository = setup.getRepository(Document)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(OrganizationMembership)
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
      documentRepository,
      service,
    }
  }
}
