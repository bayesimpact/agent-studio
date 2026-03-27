import type {
  EndpointRequestWithAgent,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"

export const requestToProjectPolicyContext = (request: EndpointRequestWithProject) => {
  return {
    organizationMembership: request.organizationMembership,
    projectMembership: request.projectMembership,
    project: request.project,
  }
}
export const requestToAgentPolicyContext = (request: EndpointRequestWithAgent) => {
  return {
    organizationMembership: request.organizationMembership,
    projectMembership: request.projectMembership,
    project: request.project,
    agent: request.agent,
    agentMembership: request.agentMembership,
  }
}
