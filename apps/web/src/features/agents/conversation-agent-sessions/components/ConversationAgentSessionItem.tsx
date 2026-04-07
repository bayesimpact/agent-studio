import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { buildDate } from "@/common/utils/build-date"
import { useBuildDeskPath } from "@/desk/hooks/use-desk-build-path"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"

export function ConversationAgentSessionItem({
  agentSession,
  organizationId,
  projectId,
  agentId,
}: {
  agentSession: ConversationAgentSession
  organizationId: string
  projectId: string
  agentId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildDeskPath } = useBuildDeskPath()
  const handleClick = () => {
    const path = buildDeskPath("agentSession", {
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
        <Button onClick={handleClick}>{t("actions:open")}</Button>
      </ItemActions>
    </Item>
  )
}
