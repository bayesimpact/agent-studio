// Generic DTOs

// API Routes (default export)
// Chat DTOs - kept in packages/api-contracts for now
export type * from "./chat/dto/chat.dto"
export { ChatBotsRoutes } from "./chat-bots/chat-bots.routes"
// Chat Bots DTOs
export type * from "./chat-bots/dto/chat-bots.dto"
export type * from "./generic"
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
export type * from "./projects/dto/projects.dto"
export { ProjectsRoutes } from "./projects/projects.routes"
export { ProtectedRoutes } from "./protected/protected.routes"
