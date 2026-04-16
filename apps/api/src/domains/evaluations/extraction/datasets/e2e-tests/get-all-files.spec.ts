import { EvaluationExtractionDatasetsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../../test/request"
import { EvaluationsModule } from "../../../evaluations.module"

describe("EvaluationExtractionDatasets - getAllFiles", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [EvaluationsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await app.close()
  })

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
    return { organization, project }
  }

  const subject = async () =>
    request({
      route: EvaluationExtractionDatasetsRoutes.getAllFiles,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
    })

  it("should return an empty list when no dataset files exist", async () => {
    await createContext()

    const res = await subject()

    expectResponse(res)
    expect(res.body.data).toEqual([])
  })

  it("should return files with sourceType evaluationExtractionDataset", async () => {
    const { organization, project } = await createContext()

    const datasetFile = documentFactory.transient({ organization, project }).build({
      sourceType: "evaluationExtractionDataset",
      fileName: "dataset.csv",
    })
    await repositories.documentRepository.save(datasetFile)

    const res = await subject()

    expectResponse(res)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({
      id: datasetFile.id,
      fileName: "dataset.csv",
      projectId,
    })
  })

  it("should not return files with other sourceTypes", async () => {
    const { organization, project } = await createContext()

    const projectFile = documentFactory.transient({ organization, project }).build({
      sourceType: "project",
      fileName: "project-doc.txt",
    })
    const datasetFile = documentFactory.transient({ organization, project }).build({
      sourceType: "evaluationExtractionDataset",
      fileName: "dataset.csv",
    })
    await repositories.documentRepository.save([projectFile, datasetFile])

    const res = await subject()

    expectResponse(res)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]!.fileName).toBe("dataset.csv")
  })

  it("should return files with all required fields", async () => {
    const { organization, project } = await createContext()

    const datasetFile = documentFactory.transient({ organization, project }).build({
      sourceType: "evaluationExtractionDataset",
    })
    await repositories.documentRepository.save(datasetFile)

    const res = await subject()

    expectResponse(res)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({
      id: expect.any(String),
      fileName: expect.any(String),
      projectId,
      size: expect.any(Number),
      storageRelativePath: expect.any(String),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    })
  })
})
