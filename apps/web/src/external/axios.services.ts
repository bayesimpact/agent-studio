import meApi from "@/features/me/external/me.api"
import { buildChatBotsApi } from "@/services/chat-bots"
import { buildOrganizationsApi } from "@/services/organizations"
import { buildProjectsApi } from "@/services/projects"
import { buildTestApi } from "@/services/test"
import { getAxiosInstance } from "./axios"

export const services = {
  me: meApi,
  // TODO: to be refactored and get inspiration from the meApi
  test: buildTestApi(getAxiosInstance()),
  // TODO: to be refactored and get inspiration from the meApi
  organizations: buildOrganizationsApi(getAxiosInstance()),
  // TODO: to be refactored and get inspiration from the meApi
  projects: buildProjectsApi(getAxiosInstance()),
  // TODO: to be refactored and get inspiration from the meApi
  chatBots: buildChatBotsApi(getAxiosInstance()),
}
