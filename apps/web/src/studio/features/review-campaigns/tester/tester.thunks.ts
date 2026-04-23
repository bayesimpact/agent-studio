import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type {
  MyReviewCampaign,
  MyTesterSessionSummary,
  StartTesterSessionResult,
  SubmitTesterFeedbackFields,
  SubmitTesterSurveyFields,
  TesterCampaignSurvey,
  TesterContext,
  TesterSessionFeedback,
  UpdateTesterFeedbackFields,
  UpdateTesterSurveyFields,
} from "./tester.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

type CampaignScopeArg = { organizationId: string; projectId: string; reviewCampaignId: string }
type SessionScopeArg = { organizationId: string; projectId: string; sessionId: string }

export const listMyReviewCampaigns = createAsyncThunk<MyReviewCampaign[], void, ThunkConfig>(
  "tester/listMyCampaigns",
  async (_, { extra: { services } }) => {
    return await services.reviewCampaignsTester.listMyCampaigns()
  },
)

export const getTesterContext = createAsyncThunk<TesterContext, CampaignScopeArg, ThunkConfig>(
  "tester/getContext",
  async (params, { extra: { services } }) => {
    return await services.reviewCampaignsTester.getTesterContext(params)
  },
)

export const startTesterSession = createAsyncThunk<
  StartTesterSessionResult,
  CampaignScopeArg & { type: "playground" | "live" },
  ThunkConfig
>("tester/startSession", async ({ type, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsTester.startSession(params, { type })
})

export const listMyTesterSessions = createAsyncThunk<
  MyTesterSessionSummary[],
  CampaignScopeArg,
  ThunkConfig
>("tester/listMyTesterSessions", async (params, { extra: { services } }) => {
  return await services.reviewCampaignsTester.listMyTesterSessions(params)
})

export const submitTesterFeedback = createAsyncThunk<
  TesterSessionFeedback,
  SessionScopeArg & { fields: SubmitTesterFeedbackFields },
  ThunkConfig
>("tester/submitFeedback", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsTester.submitFeedback(params, fields)
})

export const updateTesterFeedback = createAsyncThunk<
  TesterSessionFeedback,
  SessionScopeArg & { fields: UpdateTesterFeedbackFields },
  ThunkConfig
>("tester/updateFeedback", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsTester.updateFeedback(params, fields)
})

export const submitTesterSurvey = createAsyncThunk<
  TesterCampaignSurvey,
  CampaignScopeArg & { fields: SubmitTesterSurveyFields },
  ThunkConfig
>("tester/submitSurvey", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsTester.submitSurvey(params, fields)
})

export const updateTesterSurvey = createAsyncThunk<
  TesterCampaignSurvey,
  CampaignScopeArg & { fields: UpdateTesterSurveyFields },
  ThunkConfig
>("tester/updateSurvey", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsTester.updateSurvey(params, fields)
})

export const getMyTesterSurvey = createAsyncThunk<
  TesterCampaignSurvey | null,
  CampaignScopeArg,
  ThunkConfig
>("tester/getMyTesterSurvey", async (params, { extra: { services } }) => {
  return await services.reviewCampaignsTester.getMyTesterSurvey(params)
})

export const deleteTesterSession = createAsyncThunk<
  void,
  SessionScopeArg & { reviewCampaignId: string },
  ThunkConfig
>("tester/deleteSession", async ({ reviewCampaignId: _, ...params }, { extra: { services } }) => {
  await services.reviewCampaignsTester.deleteSession(params)
})
