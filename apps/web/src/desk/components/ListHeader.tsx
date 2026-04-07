import { FullPageCenterLayout } from "@/common/components/layouts/FullPageCenterLayout"
import { OrganizationSelector } from "@/components/organization/OrganizationSelector"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"

export function ListHeader({
  agent,
  title,
  children,
  className,
  disableOrganizationSelector = true,
}: {
  agent?: Agent
  disableOrganizationSelector?: boolean
  title: string
  path?: string
  children?: React.ReactNode
  className?: string
}) {
  const Icon = agent ? getAgentIcon(agent.type) : null
  return (
    <FullPageCenterLayout className={className}>
      <div className="flex flex-col gap-4 min-w-96 max-w-2/3 2xl:max-w-1/2">
        <div className="mb-2 border-b-4 pb-4 border-muted">
          {agent ? (
            <h2 className="text-2xl font-bold flex items-center">
              {Icon && <Icon className="mr-2" />}
              {agent.name}
            </h2>
          ) : (
            <OrganizationSelector disabled={disableOrganizationSelector} />
          )}
        </div>

        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight capitalize-first">
          {title}
        </h4>

        {children}
      </div>
    </FullPageCenterLayout>
  )
}
