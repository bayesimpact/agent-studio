import type { TimeType } from "../generic"

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
  sampleValues: unknown[]
}

export type EvaluationDatasetDto = {
  createdAt: TimeType
  documentId: string | null
  id: string
  name: string
  projectId: string
  schemaMapping: Record<string, string> | null
  updatedAt: TimeType
}

export type SetColumnRolesRequestDto = {
  columns: { name: string; role: "input" | "reference" | "target" | "ignore" }[]
}

export type SetColumnRolesResponseDto = {
  columns: { name: string; role: "input" | "reference" | "target" | "ignore" }[]
}
