import { ChatTemplatesRoutes } from "../chat-templates/chat-templates.routes"
import { MeRoutes } from "../me/me.routes"
import { OrganizationsRoutes } from "../organizations/organizations.routes"
import { ProjectsRoutes } from "../projects/projects.routes"
import { ProtectedRoutes } from "../protected/protected.routes"

export default {
  ProtectedRoutes,
  MeRoutes,
  OrganizationsRoutes,
  ProjectsRoutes,
  ChatTemplatesRoutes,
}
