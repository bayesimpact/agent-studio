import { Button } from "@caseai-connect/ui/shad/button"
import { UsersIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentDeletorWithTrigger } from "@/studio/features/agents/components/AgentDeletor"
import { AgentEditorWithTrigger } from "@/studio/features/agents/components/AgentEditor"
import { DefaultPromptDialog } from "@/studio/features/agents/components/DefaultPromptDialog"
import { buildAgentMembershipsPath } from "@/studio/routes/helpers"

export function AgentActions({ organizationId, agent }: { organizationId: string; agent: Agent }) {
  return (
    <>
      <NavAgentMemberships
        organizationId={organizationId}
        projectId={agent.projectId}
        agentId={agent.id}
      />

      <DefaultPromptDialog buttonProps={{ variant: "outline" }} prompt={agent.defaultPrompt} />

      <AgentEditorWithTrigger agent={agent} />

      <AgentDeletorWithTrigger organizationId={organizationId} agent={agent} />
    </>
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
  const path = buildAgentMembershipsPath({ organizationId, projectId, agentId })
  const handleClick = () => navigate(path)
  return (
    <Button variant="outline" size="lg" onClick={handleClick}>
      <UsersIcon />
      {t("agentMembership:members")}
    </Button>
  )
}
