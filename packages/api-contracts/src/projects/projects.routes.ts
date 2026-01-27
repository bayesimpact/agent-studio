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
    path: "projects",
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
    path: "projects/:projectId",
  }),
  deleteProject: defineRoute<ResponseData<{ success: boolean }>>({
    method: "delete",
    path: "projects/:projectId",
  }),
}
