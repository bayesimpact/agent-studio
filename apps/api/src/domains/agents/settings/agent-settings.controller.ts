import { AgentSettingsRoutes } from "@caseai-connect/api-contracts"
import type { AgentSettingsDto } from "@caseai-connect/api-contracts/src/agents/settings/agent-settings.dto"
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { AgentGuard } from "@/domains/agents/agent.guard"
import { toAgentDto } from "@/domains/agents/agent.mapper"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentsService } from "@/domains/agents/agents.service"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { Agent } from "../agent.entity"
import { extractAgentSettingsUpdateFields } from "./agent.settings.functions"
import type { AgentSettings } from "./agent-settings.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSettingsService } from "./agent-settings.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AgentGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class AgentSettingsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentSettingsService: AgentSettingsService,
  ) {}

  // History timeline of all revisions for the agent settings, including drafts and published revisions.
  @Get(AgentSettingsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canUpdate())
  async getAll(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentSettingsRoutes.getAll.response> {
    const connectScope = getRequiredConnectScope(request)
    const agent = request.agent

    const agentSettingsWithDraft = await this.agentSettingsService.getAll({
      connectScope,
      agentId: agent.id,
      includesDraft: true,
    })

    const results = agentSettingsWithDraft.map(async (settings) => {
      return toAgentSettingsDto({ agent, agentSettings: settings })
    })
    return { data: await Promise.all(results) }
  }

  @Post(AgentSettingsRoutes.restoreOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  @TrackActivity({ action: "agent.update", entityFrom: "agent" })
  async restoreOne(
    @Req() request: EndpointRequestWithAgent,
    @Param("revision") revisionParam: string,
  ): Promise<typeof AgentSettingsRoutes.restoreOne.response> {
    const revision = parseRevision(revisionParam)
    const connectScope = getRequiredConnectScope(request)
    const targetSettings = await this.agentSettingsService.get({
      connectScope,
      agentId: request.agent.id,
      revision,
    })
    if (!targetSettings) {
      throw new NotFoundException(
        `Revision ${revision} not found for agent with id ${request.agent.id}`,
      )
    }

    await this.agentsService.updateAgent({
      connectScope,
      agentId: request.agent.id,
      fieldsToUpdate: extractAgentSettingsUpdateFields(targetSettings),
    })

    return { data: { success: true } }
  }

  @Post(AgentSettingsRoutes.publishOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  @TrackActivity({ action: "agentSettings.publish", entityFrom: "agentSettings" })
  async publishOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentSettingsRoutes.publishOne.request,
    @Param("revision") revisionParam: string,
  ): Promise<typeof AgentSettingsRoutes.publishOne.response> {
    const revision = parseRevision(revisionParam)
    const connectScope = getRequiredConnectScope(request)
    const targetSettings = await this.agentSettingsService.get({
      connectScope,
      agentId: request.agent.id,
      revision,
    })
    if (!targetSettings) {
      throw new NotFoundException(
        `Revision ${revision} not found for agent with id ${request.agent.id}`,
      )
    }
    const { revisionName, revisionDesc } = payload
    const updated = await this.agentSettingsService.publish({
      connectScope,
      agentId: request.agent.id,
      revision,
      revisionName,
      revisionDesc,
    })
    if (!updated) {
      throw new UnprocessableEntityException(
        `Unable to publish revision ${revision} for agent with id ${request.agent.id}`,
      )
    }
    return { data: toAgentDto({ agent: request.agent, agentSettings: updated }) }
  }

  @Post(AgentSettingsRoutes.archiveOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @TrackActivity({ action: "agentSettings.archive", entityFrom: "agentSettings" })
  async archiveOne(
    @Req() request: EndpointRequestWithAgent,
    @Param("revision") revisionParam: string,
  ): Promise<typeof AgentSettingsRoutes.archiveOne.response> {
    const revision = parseRevision(revisionParam)
    const connectScope = getRequiredConnectScope(request)

    const targetSettings = await this.agentSettingsService.get({
      connectScope,
      agentId: request.agent.id,
      revision,
    })
    if (!targetSettings) {
      throw new NotFoundException(
        `Revision ${revision} not found for agent with id ${request.agent.id}`,
      )
    }
    const archived = await this.agentSettingsService.archive({
      connectScope,
      agentId: request.agent.id,
      revision,
    })
    if (!archived || !archived.success) {
      throw new UnprocessableEntityException(
        `Unable to archive revision ${revision} for agent with id ${request.agent.id}`,
      )
    }
    return { data: { success: true } }
  }
}

function parseRevision(revisionParam: string): number {
  const revision = Number(revisionParam)
  if (!Number.isInteger(revision) || revision < 1) {
    throw new UnprocessableEntityException(`Invalid revision "${revisionParam}"`)
  }
  return revision
}

function toAgentSettingsDto({
  agent,
  agentSettings,
}: {
  agent: Agent
  agentSettings: AgentSettings
}): AgentSettingsDto {
  const documentTagIds = agent.documentTags?.map((tag) => tag.id) || []

  const hasCategories = (agent.sessionCategories?.length ?? 0) > 0

  const mcpServers = (agent.agentMcpServers ?? []).map((agentMcpServer) => ({
    id: agentMcpServer.mcpServer.id,
    name: agentMcpServer.mcpServer.name,
    enabled: agentMcpServer.enabled,
  }))

  const projectAgentSessionCategoryIds = (agent.sessionCategories ?? [])
    .map((category) => category.projectAgentSessionCategoryId)
    .filter(
      (projectAgentSessionCategoryId): projectAgentSessionCategoryId is string =>
        projectAgentSessionCategoryId !== null,
    )

  const resourceLibraryIds = agent.resourceLibraries?.map((library) => library.id) || []

  const usedProjectAgentSessionCategoryIds = (agent.sessionCategories ?? [])
    .filter((category) => (category.conversationSessionCategories?.length ?? 0) > 0)
    .map((category) => category.projectAgentSessionCategoryId)
    .filter(
      (projectAgentSessionCategoryId): projectAgentSessionCategoryId is string =>
        projectAgentSessionCategoryId !== null,
    )

  return {
    agentId: agentSettings.agentId,
    createdAt: agentSettings.createdAt.getTime(),
    description: agentSettings.revisionDesc,
    documentsRagMode: agentSettings.documentsRagMode,
    documentTagIds,
    fillFormEnabled: agentSettings.fillFormEnabled,
    greetingMessage: agentSettings.greetingMessage ?? undefined,
    hasCategories,
    id: agentSettings.id,
    instructions: agentSettings.instructions,
    isArchived: agentSettings.isArchived,
    isDraft: agentSettings.isDraft,
    locale: agentSettings.locale,
    mcpServers,
    model: agentSettings.model,
    name: agentSettings.revisionName,
    outputJsonSchema: agentSettings.outputJsonSchema ?? undefined,
    projectAgentSessionCategoryIds,
    resourceLibraryIds,
    revision: agentSettings.revision,
    temperature: Number(agentSettings.temperature),
    updatedAt: agentSettings.updatedAt.getTime(),
    usedProjectAgentSessionCategoryIds,
  }
}
