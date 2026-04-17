import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetRecordRow,
  EvaluationExtractionDatasetSchemaColumn,
} from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import { selectRecordsData } from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { evaluationExtractionDatasetsActions } from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.slice"

const DEFAULT_LIMIT = 50

type SortState = { columnId: string; direction: "asc" | "desc" } | null

export function EvaluationExtractionDatasetRecords({
  dataset,
}: {
  dataset: EvaluationExtractionDataset
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const recordsData = useAppSelector(selectRecordsData)

  const [page, setPage] = useState(0)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortState>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schemaColumns = useMemo(
    () =>
      Object.values(dataset.schemaMapping).sort(
        (columnA, columnB) => columnA.index - columnB.index,
      ),
    [dataset.schemaMapping],
  )

  const fetchRecords = useCallback(
    (params: { page: number; columnFilters: Record<string, string>; sort: SortState }) => {
      const activeFilters = Object.fromEntries(
        Object.entries(params.columnFilters).filter(([, value]) => value.length > 0),
      )
      dispatch(
        evaluationExtractionDatasetsActions.listRecords({
          datasetId: dataset.id,
          page: params.page,
          limit: DEFAULT_LIMIT,
          columnFilters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
          sortBy: params.sort?.columnId,
          sortOrder: params.sort?.direction,
        }),
      )
    },
    [dispatch, dataset.id],
  )

  useEffect(() => {
    fetchRecords({ page, columnFilters: debouncedFilters, sort })
  }, [fetchRecords, page, debouncedFilters, sort])

  const handleColumnFilterChange = (columnId: string, value: string) => {
    const next = { ...columnFilters, [columnId]: value }
    setColumnFilters(next)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(next)
      setPage(0)
    }, 300)
  }

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.columnId === columnId) {
        if (prev.direction === "asc") return { columnId, direction: "desc" }
        return null
      }
      return { columnId, direction: "asc" }
    })
    setPage(0)
  }

  const records = ADS.isFulfilled(recordsData) ? recordsData.value.records : []
  const total = ADS.isFulfilled(recordsData) ? recordsData.value.total : 0
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT))
  const isLoading = ADS.isLoading(recordsData)
  const hasFilters = Object.values(debouncedFilters).some((value) => value.length > 0)

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluation:dataset.records.view.title")}</CardTitle>
        <CardDescription>
          {t("evaluation:dataset.records.view.description", { count: total })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10 [&_tr]:border-b">
              <tr className="border-b transition-colors">
                <th className="text-foreground h-auto px-2 py-2 text-left align-bottom font-medium whitespace-nowrap w-12">
                  {total}
                </th>
                {schemaColumns.map((schemaColumn) => (
                  <ColumnHeader
                    key={schemaColumn.id}
                    schemaColumn={schemaColumn}
                    sort={sort}
                    onSort={handleSort}
                    filterValue={columnFilters[schemaColumn.id] ?? ""}
                    onFilterChange={(value) => handleColumnFilterChange(schemaColumn.id, value)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && records.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaColumns.length + 1}
                    className="h-24 text-center text-muted-foreground p-2"
                  >
                    {t("status:loading")}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaColumns.length + 1}
                    className="h-24 text-center text-muted-foreground p-2"
                  >
                    {t("status:noResults")}
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    schemaColumns={schemaColumns}
                    rowNumber={page * DEFAULT_LIMIT + index + 1}
                    isOdd={index % 2 !== 0}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {(totalPages > 1 || hasFilters) && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ColumnHeader({
  schemaColumn,
  sort,
  onSort,
  filterValue,
  onFilterChange,
}: {
  schemaColumn: EvaluationExtractionDatasetSchemaColumn
  sort: SortState
  onSort: (columnId: string) => void
  filterValue: string
  onFilterChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const sorted = sort?.columnId === schemaColumn.id ? sort.direction : (false as const)

  return (
    <th
      className="text-foreground h-auto px-2 py-2 text-left align-bottom font-medium whitespace-nowrap"
      style={{ width: 200, minWidth: 120, maxWidth: 400 }}
    >
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onSort(schemaColumn.id)}
        >
          {schemaColumn.finalName} <Badge variant="outline">{schemaColumn.role}</Badge>
          {sorted === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : sorted === "desc" ? (
            <ArrowDownIcon className="size-3.5" />
          ) : (
            <ArrowUpDownIcon className="size-3.5" />
          )}
        </button>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/60" />
          <Input
            className="h-7 pl-7 text-xs font-normal bg-background"
            placeholder={t("actions:search")}
            value={filterValue}
            type="search"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onFilterChange(event.target.value)}
          />
        </div>
      </div>
    </th>
  )
}

function RecordRow({
  record,
  schemaColumns,
  rowNumber,
  isOdd,
}: {
  record: EvaluationExtractionDatasetRecordRow
  schemaColumns: EvaluationExtractionDatasetSchemaColumn[]
  rowNumber: number
  isOdd: boolean
}) {
  return (
    <tr className={`border-b transition-colors hover:bg-muted/50 ${isOdd ? "bg-muted/30" : ""}`}>
      <td className="p-2 align-middle whitespace-nowrap">
        <span className="font-mono text-xs text-muted-foreground/60 select-none">{rowNumber}</span>
      </td>
      {schemaColumns.map((schemaColumn) => (
        <td
          key={schemaColumn.id}
          className="p-2 align-middle whitespace-nowrap"
          style={{ width: 200, maxWidth: 400 }}
        >
          <span className="truncate block">{String(record.data[schemaColumn.id] ?? "")}</span>
        </td>
      ))}
    </tr>
  )
}

function PaginationControls({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  const from = page * DEFAULT_LIMIT + 1
  const to = Math.min((page + 1) * DEFAULT_LIMIT, total)

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-muted-foreground">
        {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon className="size-4" />
          {t("actions:previous")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {t("actions:next")}
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
