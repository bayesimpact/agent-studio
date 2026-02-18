import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
import type { EndpointRequestWithProject } from "./request.interface"

export function toConnectRequiredFields<T extends EndpointRequestWithProject>(
  request: T,
): ConnectRequiredFields {
  return {
    organizationId: request.organizationId,
    projectId: request.project.id,
    userId: request.projectMembership?.userId, // the admins or the owners of an organization don't have a project membership
  } satisfies ConnectRequiredFields
}
