import { services } from "@/external/axios.services"
import type { IAgentSessionsSpi } from "@/features/agent-sessions/agent-sessions.spi"
import type { IAgentsSpi } from "@/features/agents/agents.spi"
import type { IMeSpi } from "@/features/me/me.spi"
import type { IOrganizationsSpi } from "@/features/organizations/organizations.spi"
import type { IProjectsSpi } from "@/features/projects/projects.spi"
import type { IResourcesSpi } from "@/features/resources/resources.spi"

export type Services = {
  agents: IAgentsSpi
  agentSessions: IAgentSessionsSpi
  me: IMeSpi
  organizations: IOrganizationsSpi
  projects: IProjectsSpi
  resources: IResourcesSpi
}

export const getServices = (): Services => {
  // TODO: if .env.STORRYBOOK => mockSerivces
  // if(envProd) require("@/external/axios") // ensure axios singleton is initialized
  // else require("@/mocks") // ensure axios singleton is initialized
  return services
}
