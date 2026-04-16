import { Injectable } from "@nestjs/common"
import type { EvaluationExtractionDatasetSchemaMapping } from "../datasets/evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetRecordData } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import type { EvaluationExtractionRunKeyMapping } from "./evaluation-extraction-run.entity"
import type {
  EvaluationExtractionRunRecordComparison,
  EvaluationExtractionRunRecordFieldResult,
  EvaluationExtractionRunRecordStatus,
} from "./records/evaluation-extraction-run-record.entity"

@Injectable()
export class EvaluationExtractionRunGraderService {
  gradeRecord({
    agentOutput,
    datasetRecordData,
    keyMapping,
    schemaMapping,
  }: {
    agentOutput: Record<string, unknown>
    datasetRecordData: EvaluationExtractionDatasetRecordData
    keyMapping: EvaluationExtractionRunKeyMapping
    schemaMapping: EvaluationExtractionDatasetSchemaMapping
  }): {
    comparison: EvaluationExtractionRunRecordComparison
    status: EvaluationExtractionRunRecordStatus
  } {
    const comparison: EvaluationExtractionRunRecordComparison = {}
    let hasMismatch = false

    for (const entry of keyMapping) {
      const agentValue = agentOutput[entry.agentOutputKey] ?? null
      const groundTruth = datasetRecordData[entry.datasetColumnId] ?? null

      const column = schemaMapping[entry.datasetColumnId]
      const columnKey = column ? column.finalName : entry.datasetColumnId

      if (entry.mode === "fyi") {
        comparison[columnKey] = {
          agentValue,
          groundTruth,
          status: "fyi",
        } satisfies EvaluationExtractionRunRecordFieldResult
        continue
      }

      const isMatch = this.compareValues(agentValue, groundTruth)
      const fieldStatus = isMatch ? "match" : "mismatch"

      if (!isMatch) {
        hasMismatch = true
      }

      comparison[columnKey] = {
        agentValue,
        groundTruth,
        status: fieldStatus,
      } satisfies EvaluationExtractionRunRecordFieldResult
    }

    return {
      comparison,
      status: hasMismatch ? "mismatch" : "match",
    }
  }

  private compareValues(agentValue: unknown, groundTruth: unknown): boolean {
    const normalizedAgent = this.normalizeValue(agentValue)
    const normalizedGround = this.normalizeValue(groundTruth)

    if (normalizedAgent === null && normalizedGround === null) {
      return true
    }

    if (normalizedAgent === null || normalizedGround === null) {
      return false
    }

    return normalizedAgent === normalizedGround
  }

  private normalizeValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null
    }

    const stringValue = String(value).trim().toLowerCase()

    if (
      stringValue === "" ||
      stringValue === "null" ||
      stringValue === "n/a" ||
      stringValue === "nan" ||
      stringValue === "na"
    ) {
      return null
    }

    return stringValue
  }
}
