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
import type { EndpointRequestWithProject } from "@/request.interface"
import type { Project } from "./project.entity"
import { ProjectPolicy } from "./project.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

@Injectable()
export class ProjectsGuard implements CanActivate {
  constructor(
    readonly projectsService: ProjectsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since ProjectsGuard is called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithProject & {
      params: { projectId: string }
    }

    // fetch the project from the database if ProjectId is provided
    let project: Project | undefined
    const projectId = request.params.projectId

    // the caller didn't provide a projectId and our route mechanism uses the :projectId placeholder instead
    if (projectId === ":projectId") throw new NotFoundException()

    // ok, we have a projectId (UPDATE, DELETE routes), fetch the project from the database
    if (projectId) {
      project = await this.projectsService.getProject(request.organizationId, projectId)
      if (!project) throw new NotFoundException()

      // enhance the request object with the project
      request.project = project
    }

    const policy = new ProjectPolicy(request.userMembership, project)

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
