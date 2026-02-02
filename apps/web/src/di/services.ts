import { services } from "@/external/axios.services"
import type { IChatBotsSpi } from "@/features/chat-bots/chat-bots.spi"
import type { IChatSessionsSpi } from "@/features/chat-sessions/chat-sessions.spi"
import type { IMeSpi } from "@/features/me/me.spi"
import type { IOrganizationsSpi } from "@/features/organizations/organizations.spi"
import type { IProjectsSpi } from "@/features/projects/projects.spi"

export type Services = {
  me: IMeSpi
  organizations: IOrganizationsSpi
  projects: IProjectsSpi
  chatBots: IChatBotsSpi
  chatSessions: IChatSessionsSpi
}

export const getServices = (): Services => {
  // TODO: if .env.STORRYBOOK => mockSerivces
  // if(envProd) require("@/external/axios") // ensure axios singleton is initialized
  // else require("@/mocks") // ensure axios singleton is initialized
  return services
}
