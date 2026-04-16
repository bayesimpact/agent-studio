import type {
  EvaluationExtractionDatasetDto,
  EvaluationExtractionDatasetFileColumnDto,
  EvaluationExtractionDatasetFileDto,
  EvaluationExtractionDatasetSchemaColumnDto,
  EvaluationExtractionDatasetSchemaColumnRoleDto,
} from "@caseai-connect/api-contracts"

// DATASET FILE
export type EvaluationExtractionDatasetFile = EvaluationExtractionDatasetFileDto
export type EvaluationExtractionDatasetFileColumn = EvaluationExtractionDatasetFileColumnDto

// EVALUATION DATASET
export type EvaluationExtractionDataset = EvaluationExtractionDatasetDto
export type EvaluationExtractionDatasetSchemaColumnRole =
  EvaluationExtractionDatasetSchemaColumnRoleDto
export type EvaluationExtractionDatasetSchemaColumn = EvaluationExtractionDatasetSchemaColumnDto
