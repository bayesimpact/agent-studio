import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { CreateProjectRequestDto, CreateProjectResponseDto } from "./dto/create-project.dto"
import type { ListProjectsResponseDto } from "./dto/list-projects.dto"
import type { UpdateProjectRequestDto, UpdateProjectResponseDto } from "./dto/update-project.dto"

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
}
