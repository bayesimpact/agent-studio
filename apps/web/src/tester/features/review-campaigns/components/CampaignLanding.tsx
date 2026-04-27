import type { ReviewCampaignTesterContextDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { ArrowRightIcon, CheckCircle2Icon, FlagIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { SessionCard, type TesterSessionSummary } from "./SessionCard"

type Props = {
  context: ReviewCampaignTesterContextDto
  sessions: TesterSessionSummary[]
  participationFinished: boolean
  onStartSession: () => void
  onOpenFeedback: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
  onResumeSession: (sessionId: string) => void
  onFinishParticipating: () => void
  onEditSurvey: () => void
}

export function CampaignLanding({
  context,
  sessions,
  participationFinished,
  onStartSession,
  onOpenFeedback,
  onDeleteSession,
  onResumeSession,
  onFinishParticipating,
  onEditSurvey,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{context.name}</h1>
        {context.description && <p className="text-muted-foreground">{context.description}</p>}
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>{context.agent.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline">
                  {t(`testerCampaigns:landing.agentTypeLabel.${context.agent.type}`)}
                </Badge>
              </CardDescription>
            </div>
            <Button onClick={onStartSession} className="gap-2">
              {t("testerCampaigns:landing.startSession")} <ArrowRightIcon className="size-4" />
            </Button>
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
            {t("testerCampaigns:landing.pastSessions.title")}
          </h2>
          <span className="text-muted-foreground text-sm">
            {t("testerCampaigns:landing.pastSessions.count", { count: sessions.length })}
          </span>
        </header>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            {t("testerCampaigns:landing.pastSessions.empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpenFeedback={onOpenFeedback}
                onDelete={onDeleteSession}
                onResume={onResumeSession}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FlagIcon className="size-4" /> {t("testerCampaigns:landing.endOfPhase.title")}
        </h2>
        {participationFinished ? (
          <>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-green-600" />{" "}
              {t("testerCampaigns:landing.endOfPhase.finishedMessage")}
            </p>
            <div>
              <Button variant="outline" onClick={onEditSurvey}>
                {t("testerCampaigns:landing.endOfPhase.editSurvey")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              {t("testerCampaigns:landing.endOfPhase.description")}
            </p>
            <div>
              <Button variant="outline" onClick={onFinishParticipating}>
                {t("testerCampaigns:landing.endOfPhase.finishParticipating")}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
