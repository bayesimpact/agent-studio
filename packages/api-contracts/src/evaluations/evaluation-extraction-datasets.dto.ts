import type { TimeType } from "../generic"

// DATASET FILE
export type EvaluationExtractionDatasetFileDto = {
  createdAt: TimeType
  fileName?: string
  id: string
  projectId: string
  size?: number
  storageRelativePath?: string
  updatedAt: TimeType
}
export type EvaluationExtractionDatasetFileColumnDto = {
  id: string
  name: string
  values: string[]
}

// EVALUATION DATASET
export const EVALUATION_EXTRACTION_DATASET_SCHEMA_COLUMN_ROLES = [
  "target",
  "input",
  "reference",
  "ignore",
] as const
export type EvaluationExtractionDatasetSchemaColumnRoleDto =
  (typeof EVALUATION_EXTRACTION_DATASET_SCHEMA_COLUMN_ROLES)[number]
export type EvaluationExtractionDatasetSchemaColumnDto = {
  finalName: string
  id: string
  index: number
  originalName: string
  role: EvaluationExtractionDatasetSchemaColumnRoleDto
}
export type EvaluationExtractionDatasetSchemaMappingDto = Record<
  EvaluationExtractionDatasetSchemaColumnDto["id"],
  EvaluationExtractionDatasetSchemaColumnDto
>
export type EvaluationExtractionDatasetRecordDto = {
  columnId: string
  columnName: string
  values: unknown[]
}
export type EvaluationExtractionDatasetDto = {
  createdAt: TimeType
  documentIds: string[]
  id: string
  name: string
  projectId: string
  records: EvaluationExtractionDatasetRecordDto[]
  schemaMapping: EvaluationExtractionDatasetSchemaMappingDto
  updatedAt: TimeType
}
