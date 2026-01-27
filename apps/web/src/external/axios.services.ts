import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectsApi from "@/features/projects/external/projects.api"
import { buildChatBotsApi } from "@/services/chat-bots"
import { buildTestApi } from "@/services/test"
import { getAxiosInstance } from "./axios"

export const services = {
  me: meApi,
  organizations: organizationsApi,
  projects: projectsApi,
  // TODO: to be refactored and get inspiration from the meApi
  test: buildTestApi(getAxiosInstance()),
  // TODO: to be refactored and get inspiration from the meApi
  chatBots: buildChatBotsApi(getAxiosInstance()),
}
