import type { EvaluationExtractionRunKeyMappingEntryDto } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import type { ThunkConfig } from "@/common/store/types"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
} from "./evaluation-extraction-runs.models"

const getAll = createAsyncThunk<EvaluationExtractionRun[], void, ThunkConfig>(
  "evaluationExtractionRuns/getAll",
  async (_, { extra: { services }, getState }) => {
    const params = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationExtractionRuns.getAll(params)
  },
)

const getOne = createAsyncThunk<
  EvaluationExtractionRun,
  { evaluationExtractionRunId: string },
  ThunkConfig
>(
  "evaluationExtractionRuns/getOne",
  async ({ evaluationExtractionRunId }, { extra: { services }, getState }) => {
    const params = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationExtractionRuns.getOne({ ...params, evaluationExtractionRunId })
  },
)

const getRecords = createAsyncThunk<
  EvaluationExtractionRunRecord[],
  { evaluationExtractionRunId: string },
  ThunkConfig
>(
  "evaluationExtractionRuns/getRecords",
  async ({ evaluationExtractionRunId }, { extra: { services }, getState }) => {
    const params = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationExtractionRuns.getRecords({
      ...params,
      evaluationExtractionRunId,
    })
  },
)

const createAndExecute = createAsyncThunk<
  EvaluationExtractionRun,
  {
    evaluationExtractionDatasetId: string
    agentId: string
    keyMapping: EvaluationExtractionRunKeyMappingEntryDto[]
  },
  ThunkConfig
>(
  "evaluationExtractionRuns/createAndExecute",
  async (payload, { extra: { services }, getState }) => {
    const params = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    const run = await services.evaluationExtractionRuns.createOne({ ...params, payload })
    const executedRun = await services.evaluationExtractionRuns.executeOne({
      ...params,
      evaluationExtractionRunId: run.id,
    })
    return executedRun
  },
)

export const evaluationExtractionRunsThunks = {
  getAll,
  getOne,
  getRecords,
  createAndExecute,
}
