// Generic DTOs

// API Routes (default export)
export { default as ApiRoutes } from "./api-routes/index"
// Chat DTOs - kept in packages/api-contracts for now
export type { CreateChatSessionResponseDto } from "./chat/dto/create-chat-session.dto"
export type { MessageDto } from "./chat/dto/message.dto"
export type { MessageResponseDto } from "./chat/dto/message-response.dto"
export type { SendMessageDto } from "./chat/dto/send-message.dto"
export { ChatTemplatesRoutes } from "./chat-templates/chat-templates.routes"
// Chat Templates DTOs
export type {
  CreateChatTemplateRequestDto,
  CreateChatTemplateResponseDto,
} from "./chat-templates/dto/create-chat-template.dto"
export type {
  ChatTemplateDto,
  ListChatTemplatesResponseDto,
} from "./chat-templates/dto/list-chat-templates.dto"
export type {
  UpdateChatTemplateRequestDto,
  UpdateChatTemplateResponseDto,
} from "./chat-templates/dto/update-chat-template.dto"
export type {
  RequestPayload,
  ResponseData,
  SuccessResponseDTO,
  TimeType,
} from "./generic"
export type { ApiRoute } from "./helpers"
// Helpers
export { defineRoute } from "./helpers"
// Me DTOs
export type { MeResponseDto } from "./me/dto/me.dto"
// Routes
export { MeRoutes } from "./me/me.routes"
// Organizations DTOs
export type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
} from "./organizations/dto/create-organization.dto"
export { OrganizationsRoutes } from "./organizations/organizations.routes"
// Projects DTOs
export type {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
} from "./projects/dto/create-project.dto"
export type {
  ListProjectsResponseDto,
  ProjectDto,
} from "./projects/dto/list-projects.dto"
export type {
  UpdateProjectRequestDto,
  UpdateProjectResponseDto,
} from "./projects/dto/update-project.dto"
export { ProjectsRoutes } from "./projects/projects.routes"
export { ProtectedRoutes } from "./protected/protected.routes"
