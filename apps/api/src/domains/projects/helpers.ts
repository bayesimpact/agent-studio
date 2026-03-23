import type { EndpointRequestWithProject } from "@/common/context/request.interface"

export const requestToProjectPolicyContext = (request: EndpointRequestWithProject) => {
  return {
    organizationMembership: request.organizationMembership,
    projectMembership: request.projectMembership,
    project: request.project,
  }
}
