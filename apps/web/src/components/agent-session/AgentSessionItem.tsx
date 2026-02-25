import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { AgentSession } from "@/features/agent-sessions/agent-sessions.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { buildDate } from "@/utils/build-date"

export function AgentSessionItem({
  agentSession,
  organizationId,
  projectId,
  agentId,
}: {
  agentSession: AgentSession
  organizationId: string
  projectId: string
  agentId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation("common")
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("agentSession", {
      organizationId,
      projectId,
      agentId,
      agentSessionId: agentSession.id,
    })
    navigate(path)
  }
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>{buildDate(agentSession.updatedAt)}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("open")}</Button>
      </ItemActions>
    </Item>
  )
}
