import { UnprocessableEntityException } from "@nestjs/common"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { AgentsModule } from "../agents.module"
import { AgentExtractionRunsService } from "./agent-extraction-runs.service"

const mockLlmProvider = {
  streamChatResponse: jest.fn(),
  generateChatResponse: jest.fn(),
  generateStructuredOutput: jest.fn(),
}

describe("AgentExtractionRunsService", () => {
  let service: AgentExtractionRunsService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
      applyOverrides: (moduleBuilder) =>
        moduleBuilder.overrideProvider("LLMProvider").useValue(mockLlmProvider),
    })
    repositories = setup.getAllRepositories()
    service = setup.module.get(AgentExtractionRunsService)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  it("should execute extraction and persist a successful run", async () => {
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        type: "extraction",
        instructionPrompt: "Extract person data",
        outputJsonSchema: {
          type: "object",
          properties: { fullName: { type: "string" } },
          required: ["fullName"],
        },
      },
    })
    const document = documentFactory.transient({ organization, project }).build({
      mimeType: "application/pdf",
      sourceType: "extraction",
      storageRelativePath: "test/file.pdf",
    })
    await repositories.documentRepository.save(document)

    mockLlmProvider.generateStructuredOutput.mockResolvedValue({
      fullName: "Jane Doe",
    })

    const run = await service.executeExtraction({
      connectScope: { organizationId: organization.id, projectId: project.id },
      agent,
      userId: user.id,
      documentId: document.id,
      type: "playground",
    })

    expect(run.status).toBe("success")
    expect(run.result).toEqual({ fullName: "Jane Doe" })
    expect(mockLlmProvider.generateStructuredOutput).toHaveBeenCalledTimes(1)
  })

  it("should persist failed run when schema validation fails", async () => {
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        type: "extraction",
        instructionPrompt: "Extract person data",
        outputJsonSchema: {
          type: "object",
          properties: { fullName: { type: "string" } },
          required: ["fullName"],
        },
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
    mockLlmProvider.generateStructuredOutput.mockRejectedValue(schemaError)

    await expect(
      service.executeExtraction({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agent,
        userId: user.id,
        documentId: document.id,
        type: "playground",
      }),
    ).rejects.toThrow(UnprocessableEntityException)

    const runs = await repositories.agentExtractionRunRepository.find()
    expect(runs).toHaveLength(1)
    expect(runs[0]!.status).toBe("failed")
    expect(runs[0]!.errorCode).toBe("SCHEMA_VALIDATION_FAILED")
  })

  it("should list and retrieve runs scoped by agent", async () => {
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      agent: {
        type: "extraction",
        instructionPrompt: "Extract person data",
        outputJsonSchema: {
          type: "object",
          properties: { age: { type: "number" } },
          required: ["age"],
        },
      },
    })
    const document = documentFactory.transient({ organization, project }).build({
      mimeType: "application/pdf",
      sourceType: "extraction",
      storageRelativePath: "test/file.pdf",
    })
    await repositories.documentRepository.save(document)

    mockLlmProvider.generateStructuredOutput.mockResolvedValue({ age: 32 })

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
    expect(run?.result).toEqual({ age: 32 })
  })
})
