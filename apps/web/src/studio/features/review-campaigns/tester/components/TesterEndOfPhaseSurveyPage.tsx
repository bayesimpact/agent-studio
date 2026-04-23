"use client"

import type {
  SubmitTesterCampaignSurveyRequestDto,
  UpdateTesterCampaignSurveyRequestDto,
} from "@caseai-connect/api-contracts"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildTesterCampaignPath } from "@/studio/routes/helpers"
import { selectMySurveyForCampaign, selectTesterContext } from "../tester.selectors"
import { reviewCampaignsTesterActions } from "../tester.slice"
import {
  getMyTesterSurvey,
  getTesterContext,
  submitTesterSurvey,
  updateTesterSurvey,
} from "../tester.thunks"
import { EndOfPhaseSurveyForm } from "./EndOfPhaseSurveyForm"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

export function TesterEndOfPhaseSurveyPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const params = useParams<Params>()
  const contextState = useAppSelector(selectTesterContext)
  const existingSurvey = useAppSelector(selectMySurveyForCampaign(params.reviewCampaignId ?? ""))

  useEffect(() => {
    if (params.organizationId && params.projectId && params.reviewCampaignId) {
      dispatch(
        getTesterContext({
          organizationId: params.organizationId,
          projectId: params.projectId,
          reviewCampaignId: params.reviewCampaignId,
        }),
      )
      dispatch(
        getMyTesterSurvey({
          organizationId: params.organizationId,
          projectId: params.projectId,
          reviewCampaignId: params.reviewCampaignId,
        }),
      )
    }
    return () => {
      dispatch(reviewCampaignsTesterActions.clearSelectedContext())
    }
  }, [dispatch, params.organizationId, params.projectId, params.reviewCampaignId])

  if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return null

  const backToLanding = () => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    navigate(
      buildTesterCampaignPath({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
      }),
    )
  }

  const handleSubmit = async (
    payload: SubmitTesterCampaignSurveyRequestDto | UpdateTesterCampaignSurveyRequestDto,
  ) => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    if (existingSurvey) {
      await dispatch(
        updateTesterSurvey({
          organizationId: params.organizationId,
          projectId: params.projectId,
          reviewCampaignId: params.reviewCampaignId,
          fields: payload,
        }),
      ).unwrap()
    } else {
      await dispatch(
        submitTesterSurvey({
          organizationId: params.organizationId,
          projectId: params.projectId,
          reviewCampaignId: params.reviewCampaignId,
          fields: payload as SubmitTesterCampaignSurveyRequestDto,
        }),
      ).unwrap()
    }
    backToLanding()
  }

  if (ADS.isLoading(contextState)) {
    return <p className="p-6 text-muted-foreground text-sm">Loading…</p>
  }
  if (ADS.isError(contextState)) {
    return <p className="p-6 text-destructive text-sm">{contextState.error}</p>
  }
  if (!ADS.isFulfilled(contextState)) return null

  return (
    <EndOfPhaseSurveyForm
      questions={contextState.value.testerEndOfPhaseQuestions}
      defaults={
        existingSurvey
          ? {
              overallRating: existingSurvey.overallRating,
              comment: existingSurvey.comment,
              answers: existingSurvey.answers,
            }
          : undefined
      }
      onSubmit={handleSubmit}
      onCancel={backToLanding}
      submitLabel={existingSurvey ? "Save changes" : "Submit survey"}
    />
  )
}
