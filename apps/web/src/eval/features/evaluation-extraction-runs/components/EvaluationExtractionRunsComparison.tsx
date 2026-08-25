import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { cn } from "@caseai-connect/ui/utils"
import { type ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { TruncatedCell } from "@/common/components/shared/RecordTableParts"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { useValue } from "@/common/hooks/use-value"
import { buildSince } from "@/common/utils/build-date"
import { shortRunId } from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.helpers"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunRecordStatus,
} from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.models"
import { useEvaluationExtractionRunPath } from "@/eval/hooks/use-evaluation-extraction-run-path"
import { RunStatusBadge } from "./RunStatusBadge"

type Props = {
  runs: EvaluationExtractionRun[]
  recordsByRunId: Record<string, EvaluationExtractionRunRecord[]>
}

// Opens the run in a new tab so the comparison stays put behind it.
function RunIdLink({ runId, className }: { runId: string; className?: string }) {
  const { buildRunPath } = useEvaluationExtractionRunPath()
  return (
    <Link
      to={buildRunPath({ runId })}
      target="_blank"
      rel="noreferrer"
      className={cn("font-mono text-primary hover:underline", className)}
    >
      {shortRunId(runId)}
    </Link>
  )
}

function RecordStatusBadge({ status }: { status: EvaluationExtractionRunRecordStatus }) {
  const { t } = useTranslation()
  const variant =
    status === "match"
      ? "success"
      : status === "mismatch"
        ? "destructive"
        : status === "cancelled"
          ? "outline"
          : "secondary"
  return <Badge variant={variant}>{t(`evaluationExtractionRun:results.${status}`)}</Badge>
}

function buildMatchRate(run: EvaluationExtractionRun): number | null {
  if (!run.summary || run.summary.total === 0) return null
  return Math.round((run.summary.perfectMatches / run.summary.total) * 100)
}

export function EvaluationExtractionRunsComparison({ runs, recordsByRunId }: Props) {
  const agents = useValue(selectAgentsData)

  const agentNameById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  )

  // Best match rate across runs; used to highlight the winning column.
  const bestMatchRate = useMemo(() => {
    const matchRates = runs
      .map((run) => buildMatchRate(run))
      .filter((matchRate): matchRate is number => matchRate !== null)
    return matchRates.length > 0 ? Math.max(...matchRates) : null
  }, [runs])

  return (
    <div className="flex flex-col gap-6">
      <SummaryComparison runs={runs} agentNameById={agentNameById} bestMatchRate={bestMatchRate} />
      <RecordsComparison runs={runs} recordsByRunId={recordsByRunId} />
    </div>
  )
}

function RunColumnHeader({
  run,
  agentName,
}: {
  run: EvaluationExtractionRun
  agentName: string | undefined
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{agentName ?? "-"}</span>
      <RunIdLink runId={run.id} className="text-xs" />

      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {t("evaluationExtractionRun:version.revision", { revision: run.agentRevision })}
        {" · "}
        {buildSince(run.updatedAt)}
      </span>
    </div>
  )
}

function SummaryComparison({
  runs,
  agentNameById,
  bestMatchRate,
}: {
  runs: EvaluationExtractionRun[]
  agentNameById: Map<string, string>
  bestMatchRate: number | null
}) {
  const { t } = useTranslation()

  const rows: {
    key: string
    label: string
    render: (run: EvaluationExtractionRun) => ReactNode
  }[] = [
    {
      key: "status",
      label: t("evaluationExtractionRun:comparison.metrics.status"),
      render: (run) => <RunStatusBadge status={run.status} />,
    },
    {
      key: "agent",
      label: t("evaluationExtractionRun:comparison.metrics.agent"),
      render: (run) => <span className="text-sm">{agentNameById.get(run.agentId) ?? "-"}</span>,
    },
    {
      key: "version",
      label: t("evaluationExtractionRun:comparison.metrics.version"),
      render: (run) => (
        <span className="text-sm whitespace-nowrap">
          {t("evaluationExtractionRun:version.revision", { revision: run.agentRevision })}
        </span>
      ),
    },
    {
      key: "matchRate",
      label: t("evaluationExtractionRun:comparison.metrics.matchRate"),
      render: (run) => {
        const matchRate = buildMatchRate(run)
        if (matchRate === null) return <span className="text-muted-foreground">-</span>
        const isBest = bestMatchRate !== null && matchRate === bestMatchRate
        return (
          <span
            className={cn(
              "text-sm font-medium whitespace-nowrap",
              isBest && "text-green-700 dark:text-green-400",
            )}
          >
            {t("evaluationExtractionRun:history.matchRate", { matchRate })}
          </span>
        )
      },
    },
    {
      key: "perfectMatches",
      label: t("evaluationExtractionRun:comparison.metrics.perfectMatches"),
      render: (run) => <span className="text-sm">{run.summary?.perfectMatches ?? 0}</span>,
    },
    {
      key: "mismatches",
      label: t("evaluationExtractionRun:comparison.metrics.mismatches"),
      render: (run) => <span className="text-sm">{run.summary?.mismatches ?? 0}</span>,
    },
    {
      key: "errors",
      label: t("evaluationExtractionRun:comparison.metrics.errors"),
      render: (run) => <span className="text-sm">{run.summary?.errors ?? 0}</span>,
    },
    {
      key: "total",
      label: t("evaluationExtractionRun:comparison.metrics.total"),
      render: (run) => <span className="text-sm">{run.summary?.total ?? 0}</span>,
    },
  ]

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluationExtractionRun:comparison.summary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50 [&_tr]:border-b">
              <tr className="border-b transition-colors">
                <th className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium">
                  {t("evaluationExtractionRun:comparison.metric")}
                </th>
                {runs.map((run) => (
                  <th
                    key={run.id}
                    className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium"
                  >
                    <RunColumnHeader run={run} agentName={agentNameById.get(run.agentId)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    index % 2 !== 0 && "bg-muted/30",
                  )}
                >
                  <td className="p-3 align-middle font-medium text-muted-foreground whitespace-nowrap">
                    {row.label}
                  </td>
                  {runs.map((run) => (
                    <td key={run.id} className="p-3 align-middle">
                      {row.render(run)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

type RecordCell = {
  status: EvaluationExtractionRunRecordStatus
  // Scored fields that matched vs scored fields, when the record was compared.
  matchedFields: number | null
  scoredFields: number | null
}

type ComparisonRow = {
  key: string
  recordLabel: string
  cellsByRunId: Record<string, RecordCell | null>
}

function buildRecordLabel(record: EvaluationExtractionRunRecord): string {
  if (!record.datasetRecordData) return "-"
  return Object.values(record.datasetRecordData)
    .map((value) => String(value))
    .join(" · ")
}

function buildRecordCell(record: EvaluationExtractionRunRecord): RecordCell {
  if (!record.comparison) {
    return { status: record.status, matchedFields: null, scoredFields: null }
  }
  const fieldResults = Object.values(record.comparison).filter(
    (fieldResult) => fieldResult.status !== "fyi",
  )
  return {
    status: record.status,
    matchedFields: fieldResults.filter((fieldResult) => fieldResult.status === "match").length,
    scoredFields: fieldResults.length,
  }
}

function buildComparisonRows(
  runs: EvaluationExtractionRun[],
  recordsByRunId: Record<string, EvaluationExtractionRunRecord[]>,
): ComparisonRow[] {
  // Align records across runs by their source dataset-record id. Runs of the same
  // dataset share those ids, so the reference is whichever run returned the most
  // records; other runs are matched by id, falling back to positional index.
  const reference = runs.reduce<EvaluationExtractionRunRecord[]>((longest, run) => {
    const records = recordsByRunId[run.id] ?? []
    return records.length > longest.length ? records : longest
  }, [])

  return reference.map((referenceRecord, index) => {
    const datasetRecordId = referenceRecord.evaluationExtractionDatasetRecordId
    const cellsByRunId: Record<string, RecordCell | null> = {}
    for (const run of runs) {
      const records = recordsByRunId[run.id] ?? []
      const match = datasetRecordId
        ? records.find((record) => record.evaluationExtractionDatasetRecordId === datasetRecordId)
        : records[index]
      cellsByRunId[run.id] = match ? buildRecordCell(match) : null
    }
    return {
      key: datasetRecordId ?? `#${index}`,
      recordLabel: buildRecordLabel(referenceRecord),
      cellsByRunId,
    }
  })
}

function RecordsComparison({
  runs,
  recordsByRunId,
}: {
  runs: EvaluationExtractionRun[]
  recordsByRunId: Record<string, EvaluationExtractionRunRecord[]>
}) {
  const { t } = useTranslation()
  const rows = useMemo(() => buildComparisonRows(runs, recordsByRunId), [runs, recordsByRunId])

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluationExtractionRun:comparison.records")}</CardTitle>
        <CardDescription>
          {t("evaluationExtractionRun:comparison.recordsDescription", { count: rows.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50 [&_tr]:border-b">
              <tr className="border-b transition-colors">
                <th className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium">
                  #
                </th>
                <th className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium">
                  {t("evaluationExtractionRun:comparison.record")}
                </th>
                {runs.map((run) => (
                  <th
                    key={run.id}
                    className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium whitespace-nowrap"
                  >
                    <RunIdLink runId={run.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={2 + runs.length} className="h-24 text-center text-muted-foreground">
                    {t("evaluationExtractionRun:results.noRecords")}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      index % 2 !== 0 && "bg-muted/30",
                    )}
                  >
                    <td className="p-3 align-middle font-mono text-xs text-muted-foreground/60">
                      {index + 1}
                    </td>
                    <td className="p-3 align-middle" style={{ maxWidth: 250 }}>
                      <TruncatedCell value={row.recordLabel} />
                    </td>
                    {runs.map((run) => {
                      const cell = row.cellsByRunId[run.id] ?? null
                      if (!cell) {
                        return (
                          <td key={run.id} className="p-3 align-middle">
                            <span className="text-muted-foreground">-</span>
                          </td>
                        )
                      }
                      return (
                        <td key={run.id} className="p-3 align-middle">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <RecordStatusBadge status={cell.status} />
                            {cell.scoredFields !== null && cell.scoredFields > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {t("evaluationExtractionRun:comparison.matchedFields", {
                                  matched: cell.matchedFields,
                                  scored: cell.scoredFields,
                                })}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
