import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CHECK_POLICY_KEY, type PolicyHandler } from "@/common/policies/check-policy.decorator"
import type { EndpointRequestWithAgent } from "@/request.interface"
import type { Agent } from "./agent.entity"
import { AgentPolicy } from "./agent.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentsService } from "./agents.service"

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(
    readonly agentsService: AgentsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since AgentsGuard is called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithAgent & {
      params: { agentId: string }
    }

    // fetch the agent from the database if agentId is provided
    let agent: Agent | undefined
    const agentId = request.params.agentId

    // the caller didn't provide an agentId and our route mechanism uses the :agentId placeholder instead
    if (agentId === ":agentId") throw new NotFoundException()

    // ok, we have a agentId (UPDATE, DELETE routes), fetch the agent from the database
    if (agentId) {
      agent = (await this.agentsService.findAgentById(agentId)) ?? undefined
      if (!agent) throw new NotFoundException()

      // enhance the request object with the agent
      request.agent = agent
    }

    const policy = new AgentPolicy(request.userMembership, request.project, agent)

    const policyHandler = this.reflector.getAllAndOverride<PolicyHandler>(CHECK_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!policyHandler || !policyHandler(policy)) {
      throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    }

    return true
  }
}
