import type { ReviewerAgentSnapshotDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { CalendarIcon, UserIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  startedAt: number
  agent: ReviewerAgentSnapshotDto
  testerUserId: string
}

const formatDate = (millis: number) =>
  new Date(millis).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

const shortenId = (id: string) => `${id.slice(0, 8)}…`

export function ReviewerSessionMetadata({ startedAt, agent, testerUserId }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{agent.type}</Badge>
        <span className="font-medium">{agent.name}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <CalendarIcon className="size-4" /> {formatDate(startedAt)}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <UserIcon className="size-4" />{" "}
        {t("reviewerCampaigns:metadata.tester", { id: shortenId(testerUserId) })}
      </div>
    </div>
  )
}
