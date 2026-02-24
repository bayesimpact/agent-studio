import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../helpers"
import type { EvaluationReport } from "./evaluation-reports.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listEvaluationReports = createAsyncThunk<
  EvaluationReport[],
  { organizationId: string; projectId: string; evaluationId: string },
  ThunkConfig
>(
  "evaluationReports/list",
  async (params, { extra: { services } }) => await services.evaluationReports.getAll(params),
)

export const createEvaluationReport = createAsyncThunk<
  EvaluationReport,
  {
    agentId: string
    evaluationId: string
  },
  ThunkConfig
>(
  "evaluationReports/create",
  async ({ agentId, evaluationId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationReports.createOne({
      organizationId,
      projectId,
      agentId,
      evaluationId,
    })
  },
)
