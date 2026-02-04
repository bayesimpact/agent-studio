import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
  ListProjectsResponseDto,
  UpdateProjectRequestDto,
  UpdateProjectResponseDto,
} from "./projects.dto"

export const ProjectsRoutes = {
  createProject: defineRoute<
    ResponseData<CreateProjectResponseDto>,
    RequestPayload<CreateProjectRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects",
  }),
  listProjects: defineRoute<ResponseData<ListProjectsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects",
  }),
  updateProject: defineRoute<
    ResponseData<UpdateProjectResponseDto>,
    RequestPayload<UpdateProjectRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId",
  }),
  deleteProject: defineRoute<ResponseData<{ success: boolean }>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId",
  }),
}
