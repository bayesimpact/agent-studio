import { DocumentsRagMode, ToolName } from "@caseai-connect/api-contracts"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { StreamingService } from "../../shared/agent-session-messages/streaming/streaming.service"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

type BuildToolsArgs = {
  agent: Parameters<StreamingService["streamAgentResponse"]>[0]["agent"]
  sessionId: string
  connectScope: RequiredConnectScope
  onExecute: () => void
}

type BuildToolsAccessor = {
  buildTools: (args: BuildToolsArgs) => Promise<{ tools: Record<string, unknown> | undefined }>
}

describe("buildTools", () => {
  it("should omit document retrieval when documentsRagMode is none", async () => {
    const { streamingService, testAgent, testOrganization, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const { tools } = await (streamingService as unknown as BuildToolsAccessor).buildTools({
      agent: { ...testAgent, documentsRagMode: DocumentsRagMode.None },
      sessionId: "session-id",
      connectScope,
      onExecute: () => undefined,
    })

    expect(tools?.[ToolName.RetrieveProjectDocumentChunks]).toBeUndefined()
  })

  it("should expose document retrieval when documentsRagMode is all", async () => {
    const { streamingService, testAgent, testOrganization, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const { tools } = await (streamingService as unknown as BuildToolsAccessor).buildTools({
      agent: { ...testAgent, documentsRagMode: DocumentsRagMode.All },
      sessionId: "session-id",
      connectScope,
      onExecute: () => undefined,
    })

    expect(tools?.[ToolName.RetrieveProjectDocumentChunks]).toBeDefined()
  })

  it("should expose document retrieval when documentsRagMode is tags", async () => {
    const { streamingService, testAgent, testOrganization, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const { tools } = await (streamingService as unknown as BuildToolsAccessor).buildTools({
      agent: { ...testAgent, documentsRagMode: DocumentsRagMode.Tags },
      sessionId: "session-id",
      connectScope,
      onExecute: () => undefined,
    })

    expect(tools?.[ToolName.RetrieveProjectDocumentChunks]).toBeDefined()
  })
})
