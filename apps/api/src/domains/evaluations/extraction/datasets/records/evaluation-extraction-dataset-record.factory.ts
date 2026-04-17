import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { EvaluationExtractionDataset } from "../evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetRecord } from "./evaluation-extraction-dataset-record.entity"

type EvaluationExtractionDatasetRecordTransientParams = RequiredScopeTransientParams & {
  evaluationExtractionDataset: EvaluationExtractionDataset
}

class EvaluationExtractionDatasetRecordFactory extends Factory<
  EvaluationExtractionDatasetRecord,
  EvaluationExtractionDatasetRecordTransientParams
> {}

export const evaluationExtractionDatasetRecordFactory =
  EvaluationExtractionDatasetRecordFactory.define(({ sequence, params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }
    if (!transientParams.evaluationExtractionDataset) {
      throw new Error("evaluationExtractionDataset transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      evaluationExtractionDatasetId: transientParams.evaluationExtractionDataset.id,
      evaluationExtractionDataset: transientParams.evaluationExtractionDataset,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      data: params.data || { col1: `value_${sequence}` },
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
    } satisfies EvaluationExtractionDatasetRecord
  })
