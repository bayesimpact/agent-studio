import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import type { EndpointRequestWithProject } from "@/common/context/request.interface"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CHECK_POLICY_KEY, type PolicyHandler } from "@/common/policies/check-policy.decorator"
import { requestToProjectPolicyContext } from "../projects/helpers"
import type { Agent } from "./agent.entity"
import { AgentPolicy } from "./agent.policy"

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as EndpointRequestWithProject & {
      agent?: Agent
    }
    const policy = new AgentPolicy(requestToProjectPolicyContext(request), request.agent)

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
