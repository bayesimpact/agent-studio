import type {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
  ListProjectsResponseDto,
} from "@repo/api"
import type { RequestPayload, ResponseData } from "@/exports/dtos/generic"
import { defineRoute } from "@/helpers"

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
}
