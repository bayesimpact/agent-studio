import { AgentLocale, AgentModel, AgentsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { Agent } from "../agent.entity"
import { AgentsModule } from "../agents.module"

describe("Agents - createOne", () => {
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
      additionalImports: [AgentsModule],
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
    await sdk.shutdown()
    await app.close()
  })

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
    return { organization, project }
  }

  const subject = async (payload?: typeof AgentsRoutes.createOne.request) =>
    request({
      route: AgentsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: payload,
    })

  it("should create an agent and return it", async () => {
    await createContext()

    const response = await subject({
      payload: {
        type: "conversation",
        name: "New Agent",
        defaultPrompt: "This is a default prompt",
        model: AgentModel.Gemini25Flash,
        temperature: 0,
        locale: AgentLocale.EN,
        tagsToAdd: [],
      },
    })

    expectResponse(response, 201)
    expect(response.body.data.name).toBe("New Agent")
    expect(response.body.data.defaultPrompt).toBe("This is a default prompt")
    expect(response.body.data.model).toBe(AgentModel.Gemini25Flash)
    expect(response.body.data.locale).toBe(AgentLocale.EN)
    expect(response.body.data.projectId).toBe(projectId)
    expect(response.body.data.id).toBeDefined()

    const agentRepository = setup.getRepository(Agent)
    const agent = await agentRepository.findOne({
      where: { id: response.body.data.id },
    })
    expect(agent).not.toBeNull()
    expect(agent?.name).toBe("New Agent")
  })
})
