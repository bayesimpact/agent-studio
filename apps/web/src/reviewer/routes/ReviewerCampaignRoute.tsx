"use client"

import type { ReviewCampaignTesterContextDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@caseai-connect/ui/shad/item"
import { BarChartIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import {
  buildReviewerReportPath,
  buildReviewerSessionPath,
  ReviewerRouteNames,
} from "@/reviewer/routes/helpers"
import { selectTesterContext } from "@/tester/features/review-campaigns/tester.selectors"
import { ReviewerSessionsTable } from "../features/review-campaigns/components/ReviewerSessionsTable"
import type {
  ReviewCampaignTesterContext,
  ReviewerSessionListItem,
} from "../features/review-campaigns/reviewer.models"
import { selectReviewerSessions } from "../features/review-campaigns/reviewer.selectors"
import { reviewCampaignsReviewerActions } from "../features/review-campaigns/reviewer.slice"

type Params = {
  reviewCampaignId: string
}

/**
 * Reuses the tester `getTesterContext` endpoint to fetch campaign name +
 * description + target agent snapshot — the reviewer spec deliberately reuses
 * the same shape rather than duplicating a "reviewer-context" endpoint. The
 * fetch is dispatched by the reviewer listener middleware on `mount`, which
 * the route fires from useEffect, alongside `listReviewerSessions`.
 */
export function ReviewerCampaignRoute() {
  const params = useParams<Params>()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const contextState = useAppSelector(selectTesterContext)
  const sessionsState = useAppSelector(selectReviewerSessions(params.reviewCampaignId ?? ""))

  useMount({ actions: reviewCampaignsReviewerActions, condition: !!params.reviewCampaignId })

  if (!organizationId || !projectId || !params.reviewCampaignId) return <LoadingRoute />
  return (
    <AsyncRoute data={[contextState, sessionsState]}>
      {([contextValue, sessionsValue]) => (
        <WithData
          contextState={contextValue}
          sessions={sessionsValue}
          organizationId={organizationId}
          projectId={projectId}
          reviewCampaignId={params.reviewCampaignId ?? ""}
        />
      )}
    </AsyncRoute>
  )
}

function WithData({
  organizationId,
  projectId,
  reviewCampaignId,
  contextState,
  sessions,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
  contextState: ReviewCampaignTesterContext
  sessions: ReviewerSessionListItem[]
}) {
  const navigate = useNavigate()
  return (
    <ReviewerCampaignLanding
      context={contextState}
      sessions={sessions}
      onOpenSession={(sessionId) => {
        navigate(
          buildReviewerSessionPath({
            organizationId,
            projectId,
            reviewCampaignId,
            sessionId,
          }),
        )
      }}
      onOpenReport={() => {
        navigate(
          buildReviewerReportPath({
            organizationId,
            projectId,
            reviewCampaignId,
          }),
        )
      }}
    />
  )
}

type Props = {
  /**
   * Reuses the tester-context DTO because the admin-configured surface
   * (campaign name/description + target agent snapshot) is identical for both
   * roles. The reviewer-API milestone can later add a dedicated
   * `reviewer-context` if divergence emerges.
   */
  context: ReviewCampaignTesterContext
  sessions: ReviewerSessionListItem[]
  onOpenSession: (sessionId: string) => void
  onOpenReport: () => void
}

export function ReviewerCampaignLanding({ context, sessions, onOpenSession, onOpenReport }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleBack = () => {
    navigate(ReviewerRouteNames.HOME)
  }

  const pendingCount = sessions.filter(
    (session) => !session.callerHasReviewed && !session.callerIsSessionOwner,
  ).length

  const agentTypeLabel: Record<ReviewCampaignTesterContextDto["agent"]["type"], string> = {
    conversation: t("reviewerCampaigns:landing.agentType.conversation"),
    extraction: t("reviewerCampaigns:landing.agentType.extraction"),
    form: t("reviewerCampaigns:landing.agentType.form"),
  }

  return (
    <>
      <GridHeader
        onBack={handleBack}
        title={context.name}
        description={context.description}
        action={
          <Button variant="outline" size="sm" onClick={onOpenReport}>
            <BarChartIcon /> {t("reviewerCampaigns:landing.campaignReport")}
          </Button>
        }
      />

      <div className="p-6 flex flex-col gap-6">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{context.agent.name}</ItemTitle>
            <ItemDescription>
              <Badge variant="outline">{agentTypeLabel[context.agent.type]}</Badge>
            </ItemDescription>

            {context.agent.greetingMessage && (
              <p className="text-muted-foreground text-sm italic">
                “{context.agent.greetingMessage}”
              </p>
            )}
          </ItemContent>
        </Item>

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
    </>
  )
}
