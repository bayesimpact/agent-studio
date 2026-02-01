import chatBotsApi from "@/features/chat-bots/external/chat-bots.api"
import chatSessionApi from "@/features/chat-sessions/external/chat-sessions.api"
import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectsApi from "@/features/projects/external/projects.api"

export const services = {
  me: meApi,
  organizations: organizationsApi,
  projects: projectsApi,
  chatBots: chatBotsApi,
  chatSession: chatSessionApi,
}
