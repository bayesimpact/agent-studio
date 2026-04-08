import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import { hasFeatureOrThrow } from "@/common/hooks/use-feature-flags"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type { Evaluation } from "./evaluations.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listEvaluations = createAsyncThunk<Evaluation[], void, ThunkConfig>(
  "evaluations/list",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    hasFeatureOrThrow({ state, feature: "evaluation" })
    const params = getCurrentIds({ state, wantedIds: ["organizationId", "projectId"] })
    return await services.evaluations.getAll(params)
  },
)

export const createEvaluation = createAsyncThunk<
  Evaluation,
  { fields: Pick<Evaluation, "input" | "expectedOutput"> },
  ThunkConfig
>("evaluations/create", async (payload, { extra: { services }, getState }) => {
  const state = getState()
  hasFeatureOrThrow({ state, feature: "evaluation" })
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.evaluations.createOne(
    { organizationId, projectId },
    {
      input: payload.fields.input,
      expectedOutput: payload.fields.expectedOutput,
    },
  )
})

export const updateEvaluation = createAsyncThunk<
  void,
  { evaluationId: string; fields: Partial<Pick<Evaluation, "input" | "expectedOutput">> },
  ThunkConfig
>("evaluations/update", async ({ evaluationId, fields }, { extra: { services }, getState }) => {
  const state = getState()
  hasFeatureOrThrow({ state, feature: "evaluation" })
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  await services.evaluations.updateOne({ organizationId, projectId, evaluationId }, fields)
})

export const deleteEvaluation = createAsyncThunk<void, { evaluationId: string }, ThunkConfig>(
  "evaluations/delete",
  async ({ evaluationId }, { extra: { services }, getState }) => {
    const state = getState()
    hasFeatureOrThrow({ state, feature: "evaluation" })
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluations.deleteOne({
      organizationId,
      projectId,
      evaluationId,
    })
  },
)
