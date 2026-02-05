import chatBotsApi from "@/features/chat-bots/external/chat-bots.api"
import chatSessionsApi from "@/features/chat-sessions/external/chat-sessions.api"
import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectsApi from "@/features/projects/external/projects.api"
import resourcesApi from "@/features/resources/external/resources.api"

export const services = {
  chatBots: chatBotsApi,
  chatSessions: chatSessionsApi,
  me: meApi,
  organizations: organizationsApi,
  projects: projectsApi,
  resources: resourcesApi,
}
