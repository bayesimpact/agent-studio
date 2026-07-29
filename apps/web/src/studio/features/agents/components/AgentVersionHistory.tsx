import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { HistoryIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentVersionHistorySheet } from "./AgentVersionHistorySheet"

/**
 * Entry point of the agent settings versioning UI in the editor: a trigger button showing
 * the current revision, opening the version history sheet.
 *
 * The history itself is loaded by `StudioAgentRoute` for the whole agent subtree, so the
 * playground can label revisions too.
 */
export function AgentVersionHistory({ agent }: { agent: Agent }) {
  const { t } = useTranslation()

  return (
    <AgentVersionHistorySheet
      agent={agent}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <HistoryIcon className="size-4" />
          {t("agent:history.button")}
          <Badge variant="secondary">v{agent.revision}</Badge>
          <Badge variant={agent.isDraft ? "warning" : "success"}>
            {agent.isDraft ? t("status:draft") : t("status:published")}
          </Badge>
        </Button>
      }
    />
  )
}
