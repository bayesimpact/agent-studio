import { AgentModel } from "@caseai-connect/api-contracts"
import { UnprocessableEntityException } from "@nestjs/common"
import { z } from "zod"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { AgentsModule } from "@/domains/agents/agents.module"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions.service"

describe("ExtractionAgentSessionsService", () => {
  let service: ExtractionAgentSessionsService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
      //   applyOverrides: (moduleBuilder) =>
      //     moduleBuilder.overrideProvider("LLMProvider").useValue(mockLlmProvider),
    })
    repositories = setup.getAllRepositories()
    service = setup.module.get(ExtractionAgentSessionsService)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await sdk.shutdown()
    await teardownTestDatabase(setup)
  })

  it("should execute extraction and persist a successful run", async () => {
    const schema = z.object({ content: z.string(), source: z.string() })
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        model: AgentModel._MockGenerateStructuredOutput,
        type: "extraction",
        outputJsonSchema: schema.toJSONSchema(),
      },
    })

    const document = documentFactory.transient({ organization, project }).build({
      mimeType: "application/pdf",
      sourceType: "extraction",
      storageRelativePath: "test/file.pdf",
    })
    await repositories.documentRepository.save(document)

    const run = await service.executeExtraction({
      connectScope: { organizationId: organization.id, projectId: project.id },
      agent,
      userId: user.id,
      documentId: document.id,
      type: "playground",
    })

    expect(run.status).toBe("success")
    const result = run.result
    expect(result).toBeDefined()
    expect(() => schema.parse(result)).not.toThrow()
    const parsed = schema.parse(result)
    expect(parsed.source).toBe("MOCK") //see <default mock result for generateObject>
    expect(parsed.content).toBe("Hello, I'm the generateStructuredOutput default mock response!") //see <default mock result for generateObject>
  })

  //fixme: schema validation in a separate function
  xit("should persist failed run when schema validation fails", async () => {
    const schema = z.object({ fullname: z.string() })
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        model: AgentModel._MockGenerateStructuredOutput,
        type: "extraction",
        outputJsonSchema: schema.toJSONSchema(),
      },
    })
    const document = documentFactory.transient({ organization, project }).build({
      mimeType: "application/pdf",
      sourceType: "extraction",
      storageRelativePath: "test/file.pdf",
    })
    await repositories.documentRepository.save(document)

    const schemaError = new Error("schema mismatch")
    schemaError.name = "TypeValidationError"

    await expect(
      service.executeExtraction({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agent,
        userId: user.id,
        documentId: document.id,
        type: "playground",
      }),
    ).rejects.toThrow(UnprocessableEntityException)

    const runs = await repositories.extractionAgentSessionRepository.find()
    expect(runs).toHaveLength(1)
    expect(runs[0]!.status).toBe("failed")
    expect(runs[0]!.errorCode).toBe("SCHEMA_VALIDATION_FAILED")
  })

  it("should list and retrieve runs scoped by agent", async () => {
    const schema = z.object({ content: z.string(), source: z.string() })
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        model: AgentModel._MockGenerateStructuredOutput,
        type: "extraction",
        outputJsonSchema: schema.toJSONSchema(),
      },
    })
    const document = documentFactory.transient({ organization, project }).build({
      mimeType: "application/pdf",
      sourceType: "extraction",
      storageRelativePath: "test/file.pdf",
    })
    await repositories.documentRepository.save(document)

    const createdRun = await service.executeExtraction({
      connectScope: { organizationId: organization.id, projectId: project.id },
      agent,
      userId: user.id,
      documentId: document.id,
      type: "playground",
    })

    const runs = await service.listRuns({
      connectScope: { organizationId: organization.id, projectId: project.id },
      agentId: agent.id,
      type: "playground",
    })
    expect(runs).toHaveLength(1)
    expect(runs[0]!.id).toBe(createdRun.id)

    const run = await service.findRunById({
      connectScope: { organizationId: organization.id, projectId: project.id },
      runId: createdRun.id,
      agentId: agent.id,
      type: "playground",
    })
    expect(run).not.toBeNull()
    const result = run?.result
    expect(result).toBeDefined()
    expect(() => schema.parse(result)).not.toThrow()
    const parsed = schema.parse(result)
    expect(parsed.source).toBe("MOCK") //see <default mock result for generateObject>
    expect(parsed.content).toBe("Hello, I'm the generateStructuredOutput default mock response!") //see <default mock result for generateObject>
  })
})
