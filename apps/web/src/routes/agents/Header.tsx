import { Button } from "@caseai-connect/ui/shad/button"
import { UsersIcon } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Agent } from "@/features/agents/agents.models"
import { AgentDeletorWithTrigger } from "@/features/agents/components/AgentDeletor"
import { AgentEditorWithTrigger } from "@/features/agents/components/AgentEditor"
import { DefaultPromptDialog } from "@/features/agents/components/DefaultPromptDialog"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useIsRoute } from "@/hooks/use-is-route"
import { useAppSelector } from "@/store/hooks"
import { buildAgentMembershipsPath, RouteNames } from "../helpers"

export function useHandleHeader(agent: Agent) {
  const { isAdminInterface } = useAbility()
  const { setHeaderRightSlot } = useSidebarLayout()
  const { isRoute } = useIsRoute()
  const isAgentRoute = isRoute(RouteNames.AGENT)

  useEffect(() => {
    if (!isAgentRoute) return
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot agent={agent} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [agent, setHeaderRightSlot, isAdminInterface, isAgentRoute])
}

function HeaderRightSlot({ agent }: { agent: Agent }) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <NavAgentMemberships
        organizationId={organizationId}
        projectId={agent.projectId}
        agentId={agent.id}
      />

      <DefaultPromptDialog buttonProps={{ variant: "outline" }} prompt={agent.defaultPrompt} />

      <AgentEditorWithTrigger agent={agent} />

      <AgentDeletorWithTrigger organizationId={organizationId} agent={agent} />
    </div>
  )
}

function NavAgentMemberships({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAdminInterface } = useAbility()
  if (!isAdminInterface) return null
  const path = buildAgentMembershipsPath({ organizationId, projectId, agentId })
  const handleClick = () => navigate(path)
  return (
    <Button variant="outline" size="lg" onClick={handleClick}>
      <UsersIcon />
      {t("agentMembership:members")}
    </Button>
  )
}
