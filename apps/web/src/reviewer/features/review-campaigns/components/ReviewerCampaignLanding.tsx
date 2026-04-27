import type {
  ReviewCampaignTesterContextDto,
  ReviewerSessionListItemDto,
} from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { BarChartIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ReviewerSessionsTable } from "./ReviewerSessionsTable"

type Props = {
  /**
   * Reuses the tester-context DTO because the admin-configured surface
   * (campaign name/description + target agent snapshot) is identical for both
   * roles. The reviewer-API milestone can later add a dedicated
   * `reviewer-context` if divergence emerges.
   */
  context: ReviewCampaignTesterContextDto
  sessions: ReviewerSessionListItemDto[]
  onOpenSession: (sessionId: string) => void
  onOpenReport?: () => void
}

export function ReviewerCampaignLanding({ context, sessions, onOpenSession, onOpenReport }: Props) {
  const { t } = useTranslation()
  const pendingCount = sessions.filter(
    (session) => !session.callerHasReviewed && !session.callerIsSessionOwner,
  ).length

  const agentTypeLabel: Record<ReviewCampaignTesterContextDto["agent"]["type"], string> = {
    conversation: t("reviewerCampaigns:landing.agentType.conversation"),
    extraction: t("reviewerCampaigns:landing.agentType.extraction"),
    form: t("reviewerCampaigns:landing.agentType.form"),
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{context.name}</h1>
          {context.description && <p className="text-muted-foreground">{context.description}</p>}
        </div>
        {onOpenReport && (
          <Button variant="outline" size="sm" onClick={onOpenReport}>
            <BarChartIcon /> {t("reviewerCampaigns:landing.campaignReport")}
          </Button>
        )}
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>{context.agent.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline">{agentTypeLabel[context.agent.type]}</Badge>
            </CardDescription>
          </div>
        </CardHeader>
        {context.agent.greetingMessage && (
          <CardContent>
            <p className="text-muted-foreground text-sm italic">
              “{context.agent.greetingMessage}”
            </p>
          </CardContent>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("reviewerCampaigns:landing.sessionsHeading")}
          </h2>
          <span className="text-muted-foreground text-sm">
            {t("reviewerCampaigns:landing.sessionsCount", { count: sessions.length })}
            {pendingCount > 0
              ? t("reviewerCampaigns:landing.pendingSuffix", { count: pendingCount })
              : ""}
          </span>
        </header>
        <ReviewerSessionsTable sessions={sessions} onOpen={onOpenSession} />
      </section>
    </div>
  )
}
