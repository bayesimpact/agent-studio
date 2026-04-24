import type {
  ReviewCampaignTesterContextDto,
  ReviewerSessionListItemDto,
} from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
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
}

const AGENT_TYPE_LABEL: Record<ReviewCampaignTesterContextDto["agent"]["type"], string> = {
  conversation: "Conversation agent",
  extraction: "Extraction agent",
  form: "Form agent",
}

export function ReviewerCampaignLanding({ context, sessions, onOpenSession }: Props) {
  const pendingCount = sessions.filter(
    (session) => !session.callerHasReviewed && !session.callerIsSessionOwner,
  ).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{context.name}</h1>
        {context.description && <p className="text-muted-foreground">{context.description}</p>}
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>{context.agent.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline">{AGENT_TYPE_LABEL[context.agent.type]}</Badge>
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
          <h2 className="text-lg font-semibold">Sessions to review</h2>
          <span className="text-muted-foreground text-sm">
            {sessions.length} total{pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
          </span>
        </header>
        <ReviewerSessionsTable sessions={sessions} onOpen={onOpenSession} />
      </section>
    </div>
  )
}
