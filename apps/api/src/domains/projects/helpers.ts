import type { EndpointRequestWithProject } from "@/request.interface"

export const requestToProjectPolicyContext = (request: EndpointRequestWithProject) => {
  return {
    userMembership: request.userMembership,
    projectMembership: request.projectMembership,
    project: request.project,
  }
}
