import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { EvaluationDataset } from "../evaluation-dataset.entity"
import type { EvaluationDatasetRecord } from "./evaluation-dataset-record.entity"

type EvaluationDatasetRecordTransientParams = RequiredScopeTransientParams & {
  evaluationDataset: EvaluationDataset
}

class EvaluationDatasetRecordFactory extends Factory<
  EvaluationDatasetRecord,
  EvaluationDatasetRecordTransientParams
> {}

export const evaluationDatasetRecordFactory = EvaluationDatasetRecordFactory.define(
  ({ sequence, params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }
    if (!transientParams.evaluationDataset) {
      throw new Error("evaluationDataset transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      evaluationDatasetId: transientParams.evaluationDataset.id,
      evaluationDataset: transientParams.evaluationDataset,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      data: params.data || { col1: `value_${sequence}` },
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
    } satisfies EvaluationDatasetRecord
  },
)
