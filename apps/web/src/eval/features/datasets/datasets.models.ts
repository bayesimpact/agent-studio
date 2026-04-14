import type {
  DatasetFileColumnDto,
  DatasetFileDto,
  EvaluationDatasetDto,
} from "@caseai-connect/api-contracts"

export type DatasetFile = DatasetFileDto
export type Dataset = EvaluationDatasetDto
export type DatasetFileColumn = DatasetFileColumnDto

export const COLUMN_ROLES = ["target", "input", "reference", "ignore"] as const
export type ColumnRole = (typeof COLUMN_ROLES)[number]
export type ColumnToSave = {
  id: string
  originalName: string
  finalName: string
  role: ColumnRole
  index: number
}
