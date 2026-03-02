import { ExtractionAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { AgentsModule } from "../../agents.module"

const mockLlmProvider = {
  streamChatResponse: jest.fn(),
  generateChatResponse: jest.fn(),
  generateStructuredOutput: jest.fn(),
}

describe.skip("ExtractionAgentSessions - executeOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentId: string
  let documentId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(moduleBuilder, () => auth0Id)
          .overrideProvider("LLMProvider")
          .useValue(mockLlmProvider),
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
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const createContext = async ({
    agentType = "extraction",
  }: {
    agentType?: "conversation" | "extraction"
  } = {}) => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        type: agentType,
        outputJsonSchema: {
          type: "object",
          properties: { fullName: { type: "string" } },
          required: ["fullName"],
        },
      },
    })

    const document = documentFactory.transient({ organization, project }).build({
      sourceType: "extraction",
      mimeType: "application/pdf",
      storageRelativePath: "documents/sample.pdf",
    })
    await repositories.documentRepository.save(document)

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    documentId = document.id
    auth0Id = user.auth0Id
  }

  const subjectExecutePlayground = async (
    payload?: typeof ExtractionAgentSessionsRoutes.executePlaygroundOne.request,
  ) =>
    request({
      route: ExtractionAgentSessionsRoutes.executePlaygroundOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: payload ?? {
        payload: {
          documentId,
        },
      },
    })

  const subjectExecuteLive = async (
    payload?: typeof ExtractionAgentSessionsRoutes.executeLiveOne.request,
  ) =>
    request({
      route: ExtractionAgentSessionsRoutes.executeLiveOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: payload ?? {
        payload: {
          documentId,
        },
      },
    })

  const subjectGetAllPlayground = async () =>
    request({
      route: ExtractionAgentSessionsRoutes.getAllPlayground,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
    })

  const subjectGetAllLive = async () =>
    request({
      route: ExtractionAgentSessionsRoutes.getAllLive,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
    })

  const subjectGetOnePlayground = async (runId: string) =>
    request({
      route: ExtractionAgentSessionsRoutes.getOnePlayground,
      pathParams: removeNullish({ organizationId, projectId, agentId, runId }),
      token: accessToken,
    })

  it("should execute extraction, persist a run, and expose it in history endpoints", async () => {
    await createContext()
    mockLlmProvider.generateStructuredOutput.mockResolvedValue({ fullName: "Jane Doe" })

    const executeResponse = await subjectExecutePlayground()
    expectResponse(executeResponse, 201)
    expect(executeResponse.body.data.runId).toBeDefined()
    expect(executeResponse.body.data.result).toEqual({ fullName: "Jane Doe" })

    const getAllResponse = await subjectGetAllPlayground()
    expectResponse(getAllResponse, 200)
    expect(getAllResponse.body.data).toHaveLength(1)
    expect(getAllResponse.body.data[0]!.status).toBe("success")
    expect(getAllResponse.body.data[0]!.type).toBe("playground")
    expect(getAllResponse.body.data[0]!.documentId).toBe(documentId)

    const getOneResponse = await subjectGetOnePlayground(executeResponse.body.data.runId)
    expectResponse(getOneResponse, 200)
    expect(getOneResponse.body.data.id).toBe(executeResponse.body.data.runId)
    expect(getOneResponse.body.data.result).toEqual({ fullName: "Jane Doe" })
    expect(getOneResponse.body.data.errorCode).toBeNull()
  })

  it("should return 422 and persist failed run when schema validation fails", async () => {
    await createContext()

    const schemaError = new Error("schema mismatch")
    schemaError.name = "TypeValidationError"
    mockLlmProvider.generateStructuredOutput.mockRejectedValue(schemaError)

    const response = await subjectExecutePlayground()
    expectResponse(response, 422)

    const getAllResponse = await subjectGetAllPlayground()
    expectResponse(getAllResponse, 200)
    expect(getAllResponse.body.data).toHaveLength(1)
    expect(getAllResponse.body.data[0]!.status).toBe("failed")
    expect(getAllResponse.body.data[0]!.type).toBe("playground")
  })

  it("should return 422 when trying to run extraction with conversation agent", async () => {
    await createContext({ agentType: "conversation" })
    mockLlmProvider.generateStructuredOutput.mockResolvedValue({ fullName: "Jane Doe" })

    const response = await subjectExecutePlayground({
      payload: { documentId },
    })
    expectResponse(response, 422)
  })

  it("should isolate playground runs from live runs", async () => {
    await createContext()
    mockLlmProvider.generateStructuredOutput.mockResolvedValue({ fullName: "Jane Doe" })

    const playgroundResponse = await subjectExecutePlayground()
    expectResponse(playgroundResponse, 201)

    const liveResponse = await subjectExecuteLive()
    expectResponse(liveResponse, 201)

    const playgroundRunsResponse = await subjectGetAllPlayground()
    expectResponse(playgroundRunsResponse, 200)
    expect(playgroundRunsResponse.body.data).toHaveLength(1)
    expect(playgroundRunsResponse.body.data[0]!.type).toBe("playground")

    const liveRunsResponse = await subjectGetAllLive()
    expectResponse(liveRunsResponse, 200)
    expect(liveRunsResponse.body.data).toHaveLength(1)
    expect(liveRunsResponse.body.data[0]!.type).toBe("live")
  })
})
