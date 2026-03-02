import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Optional,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import type { ContextResolver } from "./context-resolver.interface"
import {
  ADD_CONTEXT_KEY,
  type ContextResource,
  REQUIRE_CONTEXT_KEY,
} from "./require-context.decorator"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentContextResolver } from "./resolvers/agent-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionContextResolver } from "./resolvers/agent-session-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentContextResolver } from "./resolvers/document-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EvaluationContextResolver } from "./resolvers/evaluation-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationContextResolver } from "./resolvers/organization-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectContextResolver } from "./resolvers/project-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipContextResolver } from "./resolvers/project-membership-context.resolver"

const RESOLUTION_ORDER: ContextResource[] = [
  "organization",
  "project",
  "projectMembership",
  "agent",
  "conversationAgentSession",
  "document",
  "evaluation",
]

@Injectable()
export class ResourceContextGuard implements CanActivate {
  private readonly resolverMap: Map<ContextResource, ContextResolver>

  constructor(
    private reflector: Reflector,
    @Optional() organizationContextResolver?: OrganizationContextResolver,
    @Optional() projectContextResolver?: ProjectContextResolver,
    @Optional() projectMembershipContextResolver?: ProjectMembershipContextResolver,
    @Optional() agentContextResolver?: AgentContextResolver,
    @Optional() agentSessionContextResolver?: AgentSessionContextResolver,
    @Optional() documentContextResolver?: DocumentContextResolver,
    @Optional() evaluationContextResolver?: EvaluationContextResolver,
  ) {
    const resolverEntries: Array<[ContextResource, ContextResolver]> = []
    if (organizationContextResolver) {
      resolverEntries.push([organizationContextResolver.resource, organizationContextResolver])
    }
    if (projectContextResolver) {
      resolverEntries.push([projectContextResolver.resource, projectContextResolver])
    }
    if (projectMembershipContextResolver) {
      resolverEntries.push([
        projectMembershipContextResolver.resource,
        projectMembershipContextResolver,
      ])
    }
    if (agentContextResolver) {
      resolverEntries.push([agentContextResolver.resource, agentContextResolver])
    }
    if (agentSessionContextResolver) {
      resolverEntries.push([agentSessionContextResolver.resource, agentSessionContextResolver])
    }
    if (documentContextResolver) {
      resolverEntries.push([documentContextResolver.resource, documentContextResolver])
    }
    if (evaluationContextResolver) {
      resolverEntries.push([evaluationContextResolver.resource, evaluationContextResolver])
    }
    this.resolverMap = new Map(resolverEntries)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const classLevelResources =
      this.reflector.get<ContextResource[]>(REQUIRE_CONTEXT_KEY, context.getClass()) ?? []
    const methodLevelRequiredResources = this.reflector.get<ContextResource[]>(
      REQUIRE_CONTEXT_KEY,
      context.getHandler(),
    )
    const methodLevelAddedResources =
      this.reflector.get<ContextResource[]>(ADD_CONTEXT_KEY, context.getHandler()) ?? []

    const baseResources = methodLevelRequiredResources ?? classLevelResources
    const requestedResources = [...new Set([...baseResources, ...methodLevelAddedResources])]

    for (const resourceToResolve of RESOLUTION_ORDER) {
      if (!requestedResources.includes(resourceToResolve)) continue

      const resolver = this.resolverMap.get(resourceToResolve)
      if (!resolver) {
        throw new InternalServerErrorException(
          `No resolver configured for context resource: ${resourceToResolve}`,
        )
      }
      await resolver.resolve(request)
    }

    return true
  }
}
