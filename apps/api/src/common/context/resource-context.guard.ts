import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
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
import { DocumentContextResolver } from "./resolvers/document-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationContextResolver } from "./resolvers/organization-context.resolver"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectContextResolver } from "./resolvers/project-context.resolver"

const RESOLUTION_ORDER: ContextResource[] = ["organization", "project", "document"]

@Injectable()
export class ResourceContextGuard implements CanActivate {
  private readonly resolverMap: Map<ContextResource, ContextResolver>

  constructor(
    private reflector: Reflector,
    organizationContextResolver: OrganizationContextResolver,
    projectContextResolver: ProjectContextResolver,
    documentContextResolver: DocumentContextResolver,
  ) {
    this.resolverMap = new Map(
      [organizationContextResolver, projectContextResolver, documentContextResolver].map(
        (resolver) => [resolver.resource, resolver],
      ),
    )
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
