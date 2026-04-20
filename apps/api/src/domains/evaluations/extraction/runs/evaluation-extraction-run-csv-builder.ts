import type {
  DatasetSchemaColumn,
  EvaluationExtractionDataset,
} from "../datasets/evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetRecord } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunKeyMappingEntry,
} from "./evaluation-extraction-run.entity"
import type { EvaluationExtractionRunRecord } from "./records/evaluation-extraction-run-record.entity"

const UTF8_BOM = "\uFEFF"
const STATUS_COLUMN = "Status"

type RunRecordWithDatasetRecord = EvaluationExtractionRunRecord & {
  evaluationExtractionDatasetRecord: EvaluationExtractionDatasetRecord
}

export function buildEvaluationRunCsv({
  dataset,
  run,
  records,
}: {
  dataset: EvaluationExtractionDataset
  run: EvaluationExtractionRun
  records: RunRecordWithDatasetRecord[]
}): Buffer {
  const columns = sortColumnsByIndex(dataset.schemaMapping)

  const headers = buildHeaders({ columns, keyMapping: run.keyMapping })
  const rows = records.map((record) => buildRow({ columns, keyMapping: run.keyMapping, record }))

  const csv = [headers, ...rows].map(serializeRow).join("\r\n")
  return Buffer.from(UTF8_BOM + csv, "utf-8")
}

function sortColumnsByIndex(
  schemaMapping: EvaluationExtractionDataset["schemaMapping"],
): DatasetSchemaColumn[] {
  return Object.values(schemaMapping).sort((a, b) => a.index - b.index)
}

function buildHeaders({
  columns,
  keyMapping,
}: {
  columns: DatasetSchemaColumn[]
  keyMapping: EvaluationExtractionRunKeyMappingEntry[]
}): string[] {
  const headers: string[] = []
  for (const column of columns) {
    headers.push(`${column.originalName} (${column.role})`)
  }
  for (const mapping of keyMapping) {
    headers.push(`${mapping.agentOutputKey} (agent)`)
  }
  headers.push(STATUS_COLUMN)
  return headers
}

function buildRow({
  columns,
  keyMapping,
  record,
}: {
  columns: DatasetSchemaColumn[]
  keyMapping: EvaluationExtractionRunKeyMappingEntry[]
  record: RunRecordWithDatasetRecord
}): string[] {
  const datasetData = record.evaluationExtractionDatasetRecord.data
  const comparison = record.comparison ?? {}
  const cells: string[] = []

  for (const column of columns) {
    cells.push(stringifyCell(datasetData[column.id]))
  }

  for (const mapping of keyMapping) {
    cells.push(stringifyCell(comparison[mapping.agentOutputKey]?.agentValue))
  }

  cells.push(record.status)
  return cells
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function serializeRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(",")
}

function escapeCsvCell(cell: string): string {
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

export function buildEvaluationRunCsvFileName({
  datasetName,
  runId,
}: {
  datasetName: string
  runId: string
}): string {
  const safeName = datasetName.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "dataset"
  return `${safeName}_${runId}_Results.csv`
}
