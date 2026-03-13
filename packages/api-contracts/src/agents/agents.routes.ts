import type { DocumentTagsUpdateFieldsDto } from "../document-tags/document-tag.dto"
import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentDto, ListAgentsResponseDto } from "./agents.dto"

export const AgentsRoutes = {
  createOne: defineRoute<
    ResponseData<AgentDto>,
    RequestPayload<
      Pick<AgentDto, "type" | "name" | "defaultPrompt" | "model" | "locale" | "temperature"> &
        Partial<Pick<AgentDto, "outputJsonSchema">> &
        DocumentTagsUpdateFieldsDto
    >
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents",
  }),
  getAll: defineRoute<ResponseData<ListAgentsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<
      Partial<
        Pick<
          AgentDto,
          | "name"
          | "defaultPrompt"
          | "locale"
          | "model"
          | "temperature"
          | "type"
          | "outputJsonSchema"
        >
      > &
        DocumentTagsUpdateFieldsDto
    >
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId",
  }),
}
