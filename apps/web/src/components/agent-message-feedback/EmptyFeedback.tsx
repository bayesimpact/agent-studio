import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { MessageSquareWarningIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"

export function EmptyFeedback({ agent }: { agent: Agent }) {
  const { t } = useTranslation("agentMessageFeedback", { keyPrefix: "list.empty" })
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquareWarningIcon />
        </EmptyMedia>
        <EmptyTitle>{t("title", { agentName: agent.name })}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
