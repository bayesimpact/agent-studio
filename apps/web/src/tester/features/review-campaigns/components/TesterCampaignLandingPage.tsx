import type { SubmitTesterSessionFeedbackRequestDto } from "@caseai-connect/api-contracts"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildTesterSessionPath, buildTesterSurveyPath } from "@/tester/routes/helpers"
import {
  selectMyLocalSessions,
  selectMySurveyForCampaign,
  selectTesterContext,
} from "../tester.selectors"
import { reviewCampaignsTesterActions } from "../tester.slice"
import { deleteTesterSession, startTesterSession, submitTesterFeedback } from "../tester.thunks"
import { CampaignLanding } from "./CampaignLanding"
import { FinishParticipatingDialog } from "./FinishParticipatingDialog"
import { TesterFeedbackModal } from "./TesterFeedbackModal"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

export function TesterCampaignLandingPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useParams<Params>()

  const contextState = useAppSelector(selectTesterContext)
  // FIXME:
  const sessions = useAppSelector(selectMyLocalSessions(params.reviewCampaignId ?? ""))
  // FIXME:
  const existingSurvey = useAppSelector(selectMySurveyForCampaign(params.reviewCampaignId ?? ""))

  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)

  useEffect(() => {
    dispatch(reviewCampaignsTesterActions.mount())
    return () => {
      dispatch(reviewCampaignsTesterActions.unmount())
    }
  }, [dispatch])

  // FIXME:
  if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return null

  if (ADS.isLoading(contextState)) {
    return (
      <p className="p-6 text-muted-foreground text-sm">{t("testerCampaigns:common.loading")}</p>
    )
  }
  if (ADS.isError(contextState)) {
    return <p className="p-6 text-destructive text-sm">{contextState.error}</p>
  }
  if (!ADS.isFulfilled(contextState)) return null

  const context = contextState.value

  const handleStartSession = async () => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    if (!ADS.isFulfilled(contextState)) return
    const result = await dispatch(
      startTesterSession({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        type: "live",
      }),
    ).unwrap()
    navigate(
      buildTesterSessionPath({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        agentId: contextState.value.agent.id,
        agentSessionId: result.sessionId,
      }),
    )
  }

  const handleSubmitFeedback = async (payload: SubmitTesterSessionFeedbackRequestDto) => {
    if (!feedbackSessionId || !params.organizationId || !params.projectId) return
    await dispatch(
      submitTesterFeedback({
        organizationId: params.organizationId,
        projectId: params.projectId,
        sessionId: feedbackSessionId,
        fields: payload,
      }),
    ).unwrap()
    setFeedbackSessionId(null)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    await dispatch(
      deleteTesterSession({
        organizationId: params.organizationId,
        projectId: params.projectId,
        sessionId,
        reviewCampaignId: params.reviewCampaignId,
      }),
    ).unwrap()
  }

  const handleFinish = () => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    setFinishOpen(false)
    navigate(
      buildTesterSurveyPath({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
      }),
    )
  }

  return (
    <>
      <CampaignLanding
        context={context}
        sessions={sessions}
        participationFinished={!!existingSurvey}
        onStartSession={handleStartSession}
        onOpenFeedback={(sessionId) => setFeedbackSessionId(sessionId)}
        onDeleteSession={handleDeleteSession}
        onResumeSession={(sessionId) => {
          if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
          navigate(
            buildTesterSessionPath({
              organizationId: params.organizationId,
              projectId: params.projectId,
              reviewCampaignId: params.reviewCampaignId,
              agentId: context.agent.id,
              agentSessionId: sessionId,
            }),
          )
        }}
        onFinishParticipating={() => setFinishOpen(true)}
        onEditSurvey={() =>
          params.organizationId &&
          params.projectId &&
          params.reviewCampaignId &&
          navigate(
            buildTesterSurveyPath({
              organizationId: params.organizationId,
              projectId: params.projectId,
              reviewCampaignId: params.reviewCampaignId,
            }),
          )
        }
      />

      <TesterFeedbackModal
        open={feedbackSessionId !== null}
        questions={context.testerPerSessionQuestions}
        onSubmit={handleSubmitFeedback}
        onAbandon={() => setFeedbackSessionId(null)}
      />

      <FinishParticipatingDialog
        open={finishOpen}
        onConfirm={handleFinish}
        onCancel={() => setFinishOpen(false)}
      />
    </>
  )
}
