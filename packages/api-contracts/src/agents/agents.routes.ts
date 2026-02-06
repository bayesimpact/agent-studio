import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentDto, ListAgentsResponseDto } from "./agents.dto"

export const AgentsRoutes = {
  createOne: defineRoute<
    ResponseData<AgentDto>,
    RequestPayload<Pick<AgentDto, "name" | "defaultPrompt" | "model" | "locale" | "temperature">>
  >({
    method: "post",
    path: "projects/:projectId/agents",
  }),
  getAll: defineRoute<ResponseData<ListAgentsResponseDto>>({
    method: "get",
    path: "projects/:projectId/agents",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<
      Partial<Pick<AgentDto, "name" | "defaultPrompt" | "locale" | "model" | "temperature">>
    >
  >({
    method: "patch",
    path: "projects/:projectId/agents/:agentId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "projects/:projectId/agents/:agentId",
  }),
}
