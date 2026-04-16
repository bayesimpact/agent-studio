import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { EvaluationExtractionDatasetRecord } from "../../datasets/records/evaluation-extraction-dataset-record.entity"
import type { EvaluationExtractionRun } from "../evaluation-extraction-run.entity"
import type {
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunRecordComparison,
} from "./evaluation-extraction-run-record.entity"

type EvaluationExtractionRunRecordTransientParams = RequiredScopeTransientParams & {
  evaluationExtractionRun: EvaluationExtractionRun
  evaluationExtractionDatasetRecord: EvaluationExtractionDatasetRecord
}

class EvaluationExtractionRunRecordFactory extends Factory<
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunRecordTransientParams
> {}

export const evaluationExtractionRunRecordFactory = EvaluationExtractionRunRecordFactory.define(
  ({ params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }
    if (!transientParams.evaluationExtractionRun) {
      throw new Error("evaluationExtractionRun transient is required")
    }
    if (!transientParams.evaluationExtractionDatasetRecord) {
      throw new Error("evaluationExtractionDatasetRecord transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      evaluationExtractionRunId: transientParams.evaluationExtractionRun.id,
      evaluationExtractionRun: transientParams.evaluationExtractionRun,
      evaluationExtractionDatasetRecordId: transientParams.evaluationExtractionDatasetRecord.id,
      evaluationExtractionDatasetRecord: transientParams.evaluationExtractionDatasetRecord,
      status: params.status || "match",
      comparison: (params.comparison as EvaluationExtractionRunRecordComparison) || null,
      agentRawOutput: params.agentRawOutput || null,
      errorDetails: params.errorDetails || null,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt ?? null,
    } satisfies EvaluationExtractionRunRecord
  },
)
