import { services } from "@/external/axios.services"
import type { IMeSpi } from "@/features/me/me.spi"
import type { IOrganizationsSpi } from "@/features/organizations/organizations.spi"
import type { IChatBotsApi } from "@/services/chat-bots"
import type { IProjectsApi } from "@/services/projects"
import type { ITestApi } from "@/services/test"

export type Services = {
  test: ITestApi
  me: IMeSpi
  organizations: IOrganizationsSpi
  projects: IProjectsApi
  chatBots: IChatBotsApi
}

export const getServices = () => {
  // TODO: if .env.STORRYBOOK => mockSerivces
  // if(envProd) require("@/external/axios") // ensure axios singleton is initialized
  // else require("@/mocks") // ensure axios singleton is initialized
  return services
}
