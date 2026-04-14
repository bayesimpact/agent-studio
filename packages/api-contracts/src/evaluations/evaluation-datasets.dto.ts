import type { TimeType } from "../generic"

// DATASET FILE
export type DatasetFileDto = {
  createdAt: TimeType
  fileName?: string
  id: string
  projectId: string
  size?: number
  storageRelativePath?: string
  updatedAt: TimeType
}
export type DatasetFileColumnDto = {
  id: string
  name: string
  values: string[]
}

// EVALUATION DATASET
export const EVALUATION_DATASET_SCHEMA_COLUMN_ROLES = [
  "target",
  "input",
  "reference",
  "ignore",
] as const
export type EvaluationDatasetSchemaColumnRoleDto =
  (typeof EVALUATION_DATASET_SCHEMA_COLUMN_ROLES)[number]
export type EvaluationDatasetSchemaColumnDto = {
  finalName: string
  id: string
  index: number
  originalName: string
  role: EvaluationDatasetSchemaColumnRoleDto
}
export type EvaluationDatasetSchemaMappingDto = Record<
  EvaluationDatasetSchemaColumnDto["id"],
  EvaluationDatasetSchemaColumnDto
>
export type EvaluationDatasetDto = {
  createdAt: TimeType
  documentId: string
  id: string
  name: string
  projectId: string
  schemaMapping: EvaluationDatasetSchemaMappingDto
  updatedAt: TimeType
}
