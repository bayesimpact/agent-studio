import type { EvaluationExtractionRunKeyMappingEntryDto } from "@caseai-connect/api-contracts"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
} from "./evaluation-extraction-runs.models"

type BaseParams = { organizationId: string; projectId: string }

export interface IEvaluationExtractionRunsSpi {
  createOne(
    params: BaseParams & {
      payload: {
        evaluationExtractionDatasetId: string
        agentId: string
        keyMapping: EvaluationExtractionRunKeyMappingEntryDto[]
      }
    },
  ): Promise<EvaluationExtractionRun>
  executeOne(
    params: BaseParams & { evaluationExtractionRunId: string },
  ): Promise<EvaluationExtractionRun>
  getOne(
    params: BaseParams & { evaluationExtractionRunId: string },
  ): Promise<EvaluationExtractionRun>
  getAll(params: BaseParams): Promise<EvaluationExtractionRun[]>
  getRecords(
    params: BaseParams & { evaluationExtractionRunId: string },
  ): Promise<EvaluationExtractionRunRecord[]>
}
