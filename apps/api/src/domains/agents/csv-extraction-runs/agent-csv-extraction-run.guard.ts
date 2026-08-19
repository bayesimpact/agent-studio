import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
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
import { requestToProjectPolicyContext } from "../../projects/helpers"
import type { AgentCsvExtractionRun } from "./agent-csv-extraction-run.entity"
import { AgentCsvExtractionRunPolicy } from "./agent-csv-extraction-run.policy"

type GuardedRequest = EndpointRequestWithProject & {
  agentCsvExtractionRun?: AgentCsvExtractionRun
  body?: unknown
  query?: unknown
}

@Injectable()
export class AgentCsvExtractionRunGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as GuardedRequest

    const policy = new AgentCsvExtractionRunPolicy(
      requestToProjectPolicyContext(request),
      request.agentCsvExtractionRun,
      resolveRunType(request),
    )

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

/**
 * The run type the request acts on: the loaded run's own type when the route targets one,
 * otherwise the type the client asks for (createOne payload, getAll query). A request naming an
 * unknown type is rejected outright; routes that carry no type (status stream, file columns) are
 * not type-scoped and resolve to undefined.
 */
function resolveRunType(request: GuardedRequest): BaseAgentSessionTypeDto | undefined {
  if (request.agentCsvExtractionRun) return request.agentCsvExtractionRun.type

  const requestedType = extractRequestedType(request)
  if (requestedType === undefined) return undefined
  if (requestedType !== "live" && requestedType !== "playground") {
    throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
  }
  return requestedType
}

function extractRequestedType(request: GuardedRequest): string | undefined {
  const body = typeof request.body === "object" && request.body !== null ? request.body : undefined
  const payload =
    body && "payload" in body && typeof body.payload === "object" && body.payload !== null
      ? body.payload
      : undefined
  if (payload && "type" in payload && typeof payload.type === "string") return payload.type

  const query =
    typeof request.query === "object" && request.query !== null ? request.query : undefined
  if (query && "type" in query && typeof query.type === "string") return query.type

  return undefined
}
