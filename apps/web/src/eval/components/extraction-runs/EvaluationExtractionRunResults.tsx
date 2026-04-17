import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Spinner } from "@caseai-connect/ui/shad/spinner"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetRecordRow,
} from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunRecordFieldStatus,
  EvaluationExtractionRunRecordStatus,
} from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.models"
import type { EvaluationExtractionRunDto } from "../../../../../../packages/api-contracts/src/evaluations/evaluation-extraction-runs.dto"

function StatusBadge({ status }: { status: EvaluationExtractionRunRecordStatus }) {
  const { t } = useTranslation()
  const variant =
    status === "match" ? "success" : status === "mismatch" ? "destructive" : "secondary"
  return <Badge variant={variant}>{t(`evaluationExtractionRun:results.${status}`)}</Badge>
}

function FieldStatusBadge({ status }: { status: EvaluationExtractionRunRecordFieldStatus }) {
  const { t } = useTranslation()
  const variant = status === "match" ? "success" : status === "mismatch" ? "destructive" : "outline"
  return (
    <Badge variant={variant} className="text-xs">
      {t(`evaluationExtractionRun:results.${status}`)}
    </Badge>
  )
}

export function EvaluationExtractionRunSummary({ run }: { run: EvaluationExtractionRun }) {
  const { t } = useTranslation()

  if (!run.summary) return null

  const stats = [
    { label: t("evaluationExtractionRun:results.total"), value: run.summary.total },
    {
      label: t("evaluationExtractionRun:results.perfectMatches"),
      value: run.summary.perfectMatches,
    },
    { label: t("evaluationExtractionRun:results.mismatches"), value: run.summary.mismatches },
    { label: t("evaluationExtractionRun:results.errors"), value: run.summary.errors },
  ]

  const isRunning = run.status === "pending" || run.status === "running"
  const matchRate =
    run.summary.total > 0 ? Math.round((run.summary.perfectMatches / run.summary.total) * 100) : 0

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluationExtractionRun:results.summary")}</CardTitle>
        <CardDescription>
          {isRunning ? (
            <span className="flex items-center gap-1.5">
              <Spinner />
              {t("evaluationExtractionRun:results.processing")}
            </span>
          ) : (
            `${matchRate}% match rate`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type ResultRow = {
  index: number
  status: EvaluationExtractionRunRecordStatus
  inputs: Record<string, string>
  fields: Record<
    string,
    { agentValue: string; groundTruth: string; status: EvaluationExtractionRunRecordFieldStatus }
  >
  errorDetails: string | null
}

function buildResultRows(
  records: EvaluationExtractionRunRecord[],
  dataset: EvaluationExtractionDataset,
  datasetRecords: EvaluationExtractionDatasetRecordRow[],
): ResultRow[] {
  const inputColumns = Object.values(dataset.schemaMapping)
    .filter((column) => column.role === "input")
    .sort((columnA, columnB) => columnA.index - columnB.index)

  return records.map((record, recordIndex) => {
    const inputs: Record<string, string> = {}
    const datasetRecord = datasetRecords[recordIndex]
    for (const column of inputColumns) {
      inputs[column.finalName] = String(datasetRecord?.data[column.id] ?? "")
    }

    const fields: ResultRow["fields"] = {}
    if (record.comparison) {
      for (const [key, fieldResult] of Object.entries(record.comparison)) {
        fields[key] = {
          agentValue: String(fieldResult.agentValue ?? ""),
          groundTruth: String(fieldResult.groundTruth ?? ""),
          status: fieldResult.status,
        }
      }
    }

    return {
      index: recordIndex,
      status: record.status,
      inputs,
      fields,
      errorDetails: record.errorDetails,
    }
  })
}

export function EvaluationExtractionRunRecordsTable({
  records,
  run,
  dataset,
  datasetRecords,
}: {
  records: EvaluationExtractionRunRecord[]
  run: EvaluationExtractionRun
  dataset: EvaluationExtractionDataset
  datasetRecords: EvaluationExtractionDatasetRecordRow[]
}) {
  const { t } = useTranslation()
  const isRunning = run.status === "pending" || run.status === "running"

  const inputColumnNames = useMemo(
    () =>
      Object.values(dataset.schemaMapping)
        .filter((column) => column.role === "input")
        .sort((columnA, columnB) => columnA.index - columnB.index)
        .map((column) => column.finalName),
    [dataset.schemaMapping],
  )

  const comparisonKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const record of records) {
      if (record.comparison) {
        for (const key of Object.keys(record.comparison)) {
          keys.add(key)
        }
      }
    }
    return Array.from(keys)
  }, [records])

  const hasErrors = records.some((record) => record.errorDetails)

  const data = useMemo(
    () => buildResultRows(records, dataset, datasetRecords),
    [records, dataset, datasetRecords],
  )

  const columns = useMemo<ColumnDef<ResultRow>[]>(() => {
    const indexColumn: ColumnDef<ResultRow> = {
      id: "__index",
      header: () => "#",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground/60">{row.original.index + 1}</span>
      ),
      size: 48,
    }

    const inputColumns: ColumnDef<ResultRow>[] = inputColumnNames.map((columnName) => ({
      id: `input_${columnName}`,
      header: () => (
        <div className="flex items-center gap-1.5">
          {columnName}
          <Badge variant="outline">input</Badge>
        </div>
      ),
      cell: ({ row }) => (
        <span className="truncate block">{row.original.inputs[columnName] ?? ""}</span>
      ),
      size: 250,
    }))

    const targetColumns: ColumnDef<ResultRow>[] = comparisonKeys.flatMap((comparisonKey) => {
      const mapping = run.keyMapping.find((entry) => entry.agentOutputKey === comparisonKey)
      const targetColumn = mapping
        ? Object.values(dataset.schemaMapping).find(
            (column) => column.id === mapping.datasetColumnId,
          )
        : null
      const targetName = targetColumn?.finalName ?? comparisonKey

      return [
        {
          id: `target_${comparisonKey}`,
          header: () => (
            <div className="flex items-center gap-1.5">
              {targetName}
              <Badge variant="outline">target</Badge>
            </div>
          ),
          cell: ({ row }) => {
            const field = row.original.fields[comparisonKey]
            if (!field) return <span className="text-muted-foreground">-</span>
            return <span className="font-mono text-sm">{field.groundTruth}</span>
          },
          size: 200,
        },
        {
          id: `agent_${comparisonKey}`,
          header: () => (
            <div className="flex items-center gap-1.5">
              {targetName}
              <Badge variant="default">agent</Badge>
            </div>
          ),
          cell: ({ row }) => {
            const field = row.original.fields[comparisonKey]
            if (!field) return <span className="text-muted-foreground">-</span>
            return <span className="font-mono text-sm">{field.agentValue}</span>
          },
          size: 200,
        },
      ]
    })

    const statusColumn: ColumnDef<ResultRow> = {
      id: "status",
      header: () => t("evaluationExtractionRun:results.status"),
      cell: ({ row }) => {
        const fieldEntries = Object.entries(row.original.fields)
        return (
          <div className="flex items-center gap-1">
            <StatusBadge status={row.original.status} />
            {fieldEntries.length > 1 && (
              <div className="flex gap-0.5">
                {fieldEntries.map(([fieldKey, field]) => (
                  <FieldStatusBadge key={fieldKey} status={field.status} />
                ))}
              </div>
            )}
          </div>
        )
      },
      size: 150,
    }

    const allColumns = [indexColumn, ...inputColumns, ...targetColumns, statusColumn]

    if (hasErrors) {
      allColumns.push({
        id: "errorDetails",
        header: () => t("evaluationExtractionRun:results.errorDetails"),
        cell: ({ row }) => {
          if (!row.original.errorDetails) return null
          return (
            <span className="text-xs text-destructive truncate block max-w-75">
              {row.original.errorDetails}
            </span>
          )
        },
        size: 300,
      })
    }

    return allColumns
  }, [inputColumnNames, comparisonKeys, run.keyMapping, dataset.schemaMapping, hasErrors, t])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluationExtractionRun:results.records")}</CardTitle>
        <CardDescription>
          {t("evaluation:dataset.records.view.description", { count: records.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50 [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b transition-colors">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors hover:bg-muted/50 ${row.index % 2 !== 0 ? "bg-muted/30" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-3 align-middle"
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {isRunning ? (
                      <LoadingState run={run} />
                    ) : (
                      t("evaluationExtractionRun:results.noRecords")
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState({ run }: { run: EvaluationExtractionRunDto }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2">
      <Spinner className="size-5" />
      <span>
        {t("evaluationExtractionRun:results.processingDescription", {
          processed: run.summary ? run.summary.total - run.summary.running : 0,
          total: run.summary?.total ?? 0,
        })}
      </span>
    </div>
  )
}
