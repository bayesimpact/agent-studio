import type {
  EndpointRequestWithAgent,
  EndpointRequestWithOrganizationMembership,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import type { PermissionResourceType } from "./permission.types"

type PermissionRequest = EndpointRequestWithOrganizationMembership &
  Partial<EndpointRequestWithProject> &
  Partial<EndpointRequestWithAgent> & {
    params?: Record<string, string | undefined>
  }

/**
 * Reads the resource id already resolved onto the request by context guards.
 *
 * Child resources (project, agent) intentionally have no fallback to raw route
 * params: their context resolver cross-checks that the resource belongs to the
 * organization in the URL, so a missing resolver must fail loudly instead of
 * silently checking an unvalidated id.
 */
export function resolvePermissionResourceId(
  request: PermissionRequest,
  resourceType: PermissionResourceType,
): string | undefined {
  switch (resourceType) {
    case "organization":
      return request.organizationId ?? request.params?.organizationId
    case "project":
      return request.project?.id
    case "agent":
      return request.agent?.id
  }
}
