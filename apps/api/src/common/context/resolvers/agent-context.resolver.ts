import { Injectable, NotFoundException } from "@nestjs/common"
import { toConnectRequiredFields } from "@/common/context/request-context.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentsService } from "@/domains/agents/agents.service"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithAgent, EndpointRequestWithProject } from "../request.interface"

@Injectable()
export class AgentContextResolver implements ContextResolver {
  readonly resource = "agent" as const

  constructor(private readonly agentsService: AgentsService) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { agentId?: string }
    }
    const agentId = requestWithParams.params?.agentId

    if (!agentId || agentId === ":agentId") throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProject
    const agent =
      (await this.agentsService.findAgentById({
        connectRequiredFields: toConnectRequiredFields(requestWithProject),
        agentId,
      })) ?? undefined
    if (!agent) throw new NotFoundException()

    const requestWithAgent = request as EndpointRequestWithAgent
    requestWithAgent.agent = agent
  }
}
