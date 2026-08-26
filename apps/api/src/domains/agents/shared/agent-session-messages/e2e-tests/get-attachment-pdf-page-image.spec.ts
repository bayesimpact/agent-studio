import { randomUUID } from "node:crypto"
import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { ConversationAgentSessionsModule } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.module"
import type { AgentMessageAttachmentDocument } from "@/domains/agents/shared/agent-session-messages/agent-message-attachment-document.entity"
import { agentMessageAttachmentDocumentFactory } from "@/domains/agents/shared/agent-session-messages/agent-message-attachment-document.factory"
import type { Organization } from "@/domains/organizations/organization.entity"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import type { Project } from "@/domains/projects/project.entity"
import { setupUserGuardForTesting } from "../../../../../../test/e2e.helpers"

describe("AgentSessionMessagesRoutes.getAttachmentPdfPageImage (public)", () => {
  // 1. INFRASTRUCTURE VARIABLES
  let app: INestApplication<App>
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  // 2. MUTABLE STATE
  let auth0Id = "auth0|123"

  // 3. LIFECYCLE HOOKS
  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [ConversationAgentSessionsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  // 4. CONTEXT HELPER
  const seedAttachment = async (
    overrides: Partial<AgentMessageAttachmentDocument> = {},
  ): Promise<{
    organization: Organization
    project: Project
    attachmentDocument: AgentMessageAttachmentDocument
  }> => {
    const { organization, project } = await createOrganizationWithProject(repositories)
    const attachmentDocumentId = randomUUID()
    const attachmentDocument = agentMessageAttachmentDocumentFactory
      .transient({ organization, project })
      .build({
        id: attachmentDocumentId,
        storageRelativePath: `${organization.id}/${project.id}/${attachmentDocumentId}.pdf`,
        mimeType: "application/pdf",
        pdfPageCount: 3,
        ...overrides,
      })
    await repositories.agentMessageAttachmentDocumentRepository.save(attachmentDocument)
    return { organization, project, attachmentDocument }
  }

  // 5. SUBJECT
  const subject = ({
    organizationId,
    projectId,
    attachmentDocumentId,
    pageNumber,
  }: {
    organizationId: string
    projectId: string
    attachmentDocumentId: string
    pageNumber: string
  }) => {
    const path = AgentSessionMessagesRoutes.getAttachmentPdfPageImage.getPath({
      organizationId,
      projectId,
      attachmentDocumentId,
      pageNumber,
    })
    return supertest(app.getHttpServer()).get(path).redirects(0)
  }

  // 6. TESTS
  it("redirects to the signed url of the rendered page image", async () => {
    const { organization, project, attachmentDocument } = await seedAttachment()

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      attachmentDocumentId: attachmentDocument.id,
      pageNumber: "2",
    })

    expect(response.status).toBe(302)
    expect(response.headers.location).toContain(
      `/${organization.id}/${project.id}/derived/${attachmentDocument.id}/page-2.png`,
    )
  })

  it("returns 404 when the attachment belongs to another project", async () => {
    const { organization, attachmentDocument } = await seedAttachment()
    const { project: otherProject } = await createOrganizationWithProject(repositories)

    const response = await subject({
      organizationId: organization.id,
      projectId: otherProject.id,
      attachmentDocumentId: attachmentDocument.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })

  it("returns 404 when pdfPageCount is null (not rendered yet)", async () => {
    const { organization, project, attachmentDocument } = await seedAttachment({
      pdfPageCount: null,
    })

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      attachmentDocumentId: attachmentDocument.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })

  it.each(["0", "4", "abc"])("returns 404 when pageNumber is %s", async (pageNumber) => {
    const { organization, project, attachmentDocument } = await seedAttachment()

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      attachmentDocumentId: attachmentDocument.id,
      pageNumber,
    })

    expect(response.status).toBe(404)
  })

  it("returns 404 when mimeType is not application/pdf", async () => {
    const { organization, project, attachmentDocument } = await seedAttachment({
      mimeType: "image/png",
    })

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      attachmentDocumentId: attachmentDocument.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })
})
