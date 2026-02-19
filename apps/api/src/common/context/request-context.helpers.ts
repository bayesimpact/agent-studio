import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { EndpointRequestWithProject } from "./request.interface"

export function getRequiredConnectScope<T extends EndpointRequestWithProject>(
  request: T,
): RequiredConnectScope {
  return {
    organizationId: request.organizationId,
    projectId: request.project.id,
    userId: request.projectMembership?.userId, // the admins or the owners of an organization don't have a project membership
  }
}
