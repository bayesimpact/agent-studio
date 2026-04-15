import type { EvaluationDatasetSchemaColumnDto } from "@caseai-connect/api-contracts"
import { EvaluationDatasetsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import type { Repository } from "typeorm"
import { bindExpectActivityCreated } from "@/common/test/activity-test.helpers"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { ActivitiesModule } from "@/domains/activities/activities.module"
import { FILE_STORAGE_SERVICE } from "@/domains/documents/storage/file-storage.interface"
import { createOrganizationWithDocument } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { EvaluationDataset } from "../../datasets/evaluation-dataset.entity"
import { evaluationDatasetFactory } from "../../datasets/evaluation-dataset.factory"
import { EvaluationDatasetDocument } from "../../datasets/evaluation-dataset-document.entity"
import { EvaluationDatasetRecord } from "../../datasets/records/evaluation-dataset-record.entity"
import { EvaluationsModule } from "../../evaluations.module"

const CSV_CONTENT = "question,answer\nWhat is 1+1?,2\nWhat is 2+2?,4"

const mockFileStorageService = {
  readFile: jest.fn().mockResolvedValue(Buffer.from(CSV_CONTENT)),
  save: jest.fn(),
  getTemporaryUrl: jest.fn(),
  generateSignedUploadUrl: jest.fn(),
  buildStorageRelativePath: jest.fn(),
}

describe("EvaluationDatasets - updateOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories
  let datasetRepository: Repository<EvaluationDataset>
  let datasetDocumentRepository: Repository<EvaluationDatasetDocument>
  let recordRepository: Repository<EvaluationDatasetRecord>
  let expectActivityCreated: ReturnType<typeof bindExpectActivityCreated>

  let organizationId: string
  let projectId: string
  let documentId: string
  let datasetId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [EvaluationsModule, ActivitiesModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(moduleBuilder, () => auth0Id)
          .overrideProvider(FILE_STORAGE_SERVICE)
          .useValue(mockFileStorageService),
    })
    repositories = setup.getAllRepositories()
    datasetRepository = setup.getRepository(EvaluationDataset)
    datasetDocumentRepository = setup.getRepository(EvaluationDatasetDocument)
    recordRepository = setup.getRepository(EvaluationDatasetRecord)
    expectActivityCreated = bindExpectActivityCreated(repositories.activityRepository)
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = "auth0|123"
    mockFileStorageService.readFile.mockResolvedValue(Buffer.from(CSV_CONTENT))
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await app.close()
  })

  const columns: EvaluationDatasetSchemaColumnDto[] = [
    { id: "col-q", finalName: "question", originalName: "question", index: 0, role: "input" },
    { id: "col-a", finalName: "answer", originalName: "answer", index: 1, role: "target" },
  ]

  const createContext = async () => {
    const { user, organization, project, document } = await createOrganizationWithDocument(
      repositories,
      { document: { sourceType: "evaluationDataset", fileName: "dataset.csv" } },
    )
    organizationId = organization.id
    projectId = project.id
    documentId = document.id
    auth0Id = user.auth0Id

    const dataset = evaluationDatasetFactory.transient({ organization, project }).build()
    await datasetRepository.save(dataset)
    datasetId = dataset.id

    return { organization, project, document, dataset }
  }

  const subject = async (payload?: typeof EvaluationDatasetsRoutes.updateOne.request) =>
    request({
      route: EvaluationDatasetsRoutes.updateOne,
      pathParams: removeNullish({ organizationId, projectId, datasetId, documentId }),
      token: accessToken,
      request: payload,
    })

  it("should update dataset name and schema mapping", async () => {
    await createContext()

    const res = await subject({ payload: { name: "Updated Dataset", columns } })

    expectResponse(res)
    expect(res.body.data).toMatchObject({ success: true })

    const updatedDataset = await datasetRepository.findOneBy({ id: datasetId })
    expect(updatedDataset).not.toBeNull()
    expect(updatedDataset!.name).toBe("Updated Dataset")
    expect(updatedDataset!.schemaMapping).toMatchObject({
      "col-q": {
        id: "col-q",
        finalName: "question",
        originalName: "question",
        index: 0,
        role: "input",
      },
      "col-a": {
        id: "col-a",
        finalName: "answer",
        originalName: "answer",
        index: 1,
        role: "target",
      },
    })
    await expectActivityCreated("evaluationDataset.update")
  })

  it("should link the document to the dataset", async () => {
    await createContext()

    await subject({ payload: { name: "Dataset with File", columns } })

    const links = await datasetDocumentRepository.find({
      where: { evaluationDatasetId: datasetId },
    })
    expect(links).toHaveLength(1)
    expect(links[0].documentId).toBe(documentId)
  })

  it("should create records from the CSV file", async () => {
    await createContext()

    await subject({ payload: { name: "Dataset with Records", columns } })

    const records = await recordRepository.find({
      where: { evaluationDatasetId: datasetId },
    })
    expect(records).toHaveLength(2)

    const recordData = records.map((record) => record.data)
    expect(recordData).toContainEqual({ "col-q": "What is 1+1?", "col-a": "2" })
    expect(recordData).toContainEqual({ "col-q": "What is 2+2?", "col-a": "4" })
  })

  it("should reject an empty name", async () => {
    await createContext()

    const res = await subject({ payload: { name: "   ", columns } })

    expectResponse(res, 422)
  })
})
