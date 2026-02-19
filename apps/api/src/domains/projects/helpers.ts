import type { EndpointRequestWithProject } from "@/common/context/request.interface"

export const requestToProjectPolicyContext = (request: EndpointRequestWithProject) => {
  return {
    userMembership: request.userMembership,
    projectMembership: request.projectMembership,
    project: request.project,
  }
}
