import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { DocumentsModule } from "../documents.module"
import { DocumentsService } from "../documents.service"
import { withDocumentEmbeddingsBatchServiceMock } from "../test-overrides"

export function documentsServiceTestSetup() {
  let service: DocumentsService
  let repositories: AllRepositories
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: withDocumentEmbeddingsBatchServiceMock,
    })
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    service = setup.module.get<DocumentsService>(DocumentsService)
    repositories = setup.getAllRepositories()
  })

  return () => {
    return { repositories, service }
  }
}
