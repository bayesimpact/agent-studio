import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Checkbox } from "@caseai-connect/ui/shad/checkbox"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowRightIcon, GitCompareIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { useValue } from "@/common/hooks/use-value"
import { buildSince } from "@/common/utils/build-date"
import { shortRunId } from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.helpers"
import type { EvaluationExtractionRun } from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.models"
import { useEvaluationExtractionRunPath } from "@/eval/hooks/use-evaluation-extraction-run-path"
import { DocumentOpener } from "@/studio/features/documents/components/DocumentOpener"
import { AgentMetadataDialog } from "./AgentMetadataDialog"
import { DeleteEvaluationExtractionRunButton } from "./DeleteEvaluationExtractionRunButton"
import { RunStatusBadge } from "./RunStatusBadge"

function buildMatchRate(run: EvaluationExtractionRun): number | null {
  if (!run.summary || run.summary.total === 0) return null
  return Math.round((run.summary.perfectMatches / run.summary.total) * 100)
}

export function EvaluationExtractionRunHistory({ runs }: { runs: EvaluationExtractionRun[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { buildRunPath, buildComparePath } = useEvaluationExtractionRunPath()
  const agents = useValue(selectAgentsData)

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const agentNameById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  )

  const handleOpen = useCallback(
    (runId: string) => {
      navigate(buildRunPath({ runId }))
    },
    [navigate, buildRunPath],
  )

  const columns = useMemo<ColumnDef<EvaluationExtractionRun>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label={t("actions:selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("actions:select")}
          />
        ),
        size: 40,
      },
      {
        id: "id",
        header: () => t("evaluationExtractionRun:history.columns.id"),
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
            {shortRunId(row.original.id)}
          </span>
        ),
        size: 120,
      },
      {
        id: "status",
        header: () => t("evaluationExtractionRun:history.columns.status"),
        cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
        size: 120,
      },
      {
        id: "date",
        header: () => t("evaluationExtractionRun:history.columns.date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {buildSince(row.original.updatedAt)}
          </span>
        ),
        size: 140,
      },
      {
        id: "agent",
        header: () => t("evaluationExtractionRun:history.columns.agent"),
        cell: ({ row }) => {
          const agentName = agentNameById.get(row.original.agentId)
          if (!agentName) return <span className="text-muted-foreground">-</span>
          return <span className="text-sm">{agentName}</span>
        },
        size: 180,
      },
      {
        id: "version",
        header: () => t("evaluationExtractionRun:history.columns.version"),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {t("evaluationExtractionRun:version.revision", {
              revision: row.original.agentRevision,
            })}
          </span>
        ),
        size: 90,
      },
      {
        id: "matchRate",
        header: () => t("evaluationExtractionRun:history.columns.matchRate"),
        cell: ({ row }) => {
          const matchRate = buildMatchRate(row.original)
          if (matchRate === null) return <span className="text-muted-foreground">-</span>
          return (
            <span className="text-sm font-medium whitespace-nowrap">
              {t("evaluationExtractionRun:history.matchRate", { matchRate })}
            </span>
          )
        },
        size: 120,
      },
      {
        id: "records",
        header: () => t("evaluationExtractionRun:history.columns.records"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {row.original.summary?.total ?? 0}
          </span>
        ),
        size: 100,
      },
      {
        id: "actions",
        header: () => <></>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {row.original.csvExportDocumentId && (
              <DocumentOpener
                buttonProps={{ size: "sm" }}
                documentId={row.original.csvExportDocumentId}
              />
            )}
            <AgentMetadataDialog
              buttonProps={{ variant: "secondary", size: "sm" }}
              agentId={row.original.agentId}
              revision={row.original.agentRevision}
            />
            <DeleteEvaluationExtractionRunButton
              buttonProps={{ variant: "secondary", size: "icon-sm" }}
              runId={row.original.id}
            />
            <Button onClick={() => handleOpen(row.original.id)} size="icon-sm">
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        ),
        size: 200,
      },
    ],
    [t, agentNameById, handleOpen],
  )

  const table = useReactTable({
    data: runs,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (run) => run.id,
    getCoreRowModel: getCoreRowModel(),
  })

  const selectedRunIds = table.getSelectedRowModel().rows.map((row) => row.original.id)
  const canCompare = selectedRunIds.length >= 2

  const handleCompare = () => {
    navigate(buildComparePath({ runIds: selectedRunIds }))
  }

  if (runs.length === 0) return null

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluationExtractionRun:history.title")}</CardTitle>
        <CardDescription>
          {t("evaluationExtractionRun:history.description", { count: runs.length })}
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={handleCompare} disabled={!canCompare}>
            <GitCompareIcon className="size-4" />
            {selectedRunIds.length > 0
              ? t("evaluationExtractionRun:history.compareSelected", {
                  count: selectedRunIds.length,
                })
              : t("evaluationExtractionRun:history.compare")}
          </Button>
        </CardAction>
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
                      className="text-foreground h-auto px-3 py-2 text-left align-bottom font-medium whitespace-nowrap"
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
                    <td key={cell.id} className="p-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
