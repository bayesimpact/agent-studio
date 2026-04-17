import {
  EVALUATION_EXTRACTION_RUN_STATUS_CHANGED_CHANNEL_DTO,
  type EvaluationExtractionRunStatusChangedEventDto,
  EvaluationExtractionRunsRoutes,
} from "@caseai-connect/api-contracts"
import { readSSEStream, type SSEStreamConfig } from "@/common/sse/sse-stream-reader"
import type { EvaluationExtractionRunStatusChangedEvent } from "../evaluation-extraction-runs.models"

const evaluationExtractionRunSSEConfig: SSEStreamConfig<
  EvaluationExtractionRunStatusChangedEventDto,
  EvaluationExtractionRunStatusChangedEvent
> = {
  label: "Evaluation extraction run",
  getStreamPath: (params) =>
    EvaluationExtractionRunsRoutes.streamRunStatus.getPath({
      organizationId: params.organizationId,
      projectId: params.projectId,
    }),
  isExpectedEvent: (dto) => dto.type === EVALUATION_EXTRACTION_RUN_STATUS_CHANGED_CHANNEL_DTO,
  fromDto: (dto) => ({
    evaluationExtractionRunId: dto.evaluationExtractionRunId,
    status: dto.status,
    summary: dto.summary,
    updatedAt: dto.updatedAt,
  }),
}

export async function streamEvaluationExtractionRunStatus(params: {
  organizationId: string
  projectId: string
  signal?: AbortSignal
  onStatusChanged: (event: EvaluationExtractionRunStatusChangedEvent) => void
}): Promise<void> {
  return readSSEStream({
    config: evaluationExtractionRunSSEConfig,
    organizationId: params.organizationId,
    projectId: params.projectId,
    signal: params.signal,
    onStatusChanged: params.onStatusChanged,
  })
}
