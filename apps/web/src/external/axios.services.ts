import chatBotsApi from "@/features/chat-bots/external/chat-bots.api"
import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectsApi from "@/features/projects/external/projects.api"
import { buildTestApi } from "@/services/test"
import { getAxiosInstance } from "./axios"

export const services = {
  me: meApi,
  organizations: organizationsApi,
  projects: projectsApi,
  chatBots: chatBotsApi,
  // TODO: to be refactored and get inspiration from the meApi
  test: buildTestApi(getAxiosInstance()),
}
