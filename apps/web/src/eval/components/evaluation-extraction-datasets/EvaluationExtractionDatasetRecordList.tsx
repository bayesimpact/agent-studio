import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetSchemaColumn,
} from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"

const ROW_HEIGHT = 37

type DatasetRecordRow = Record<string, string | number> & { __rowIndex: number }

function buildRecordRows(dataset: EvaluationExtractionDataset): DatasetRecordRow[] {
  const recordsByColumnId = new Map(dataset.records.map((record) => [record.columnId, record]))
  const rowCount = dataset.records[0]?.values.length ?? 0
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: DatasetRecordRow = { __rowIndex: rowIndex }
    for (const column of Object.values(dataset.schemaMapping)) {
      row[column.id] = String(recordsByColumnId.get(column.id)?.values[rowIndex] ?? "")
    }
    return row
  })
}

function SortableHeader({
  sorted,
  onToggle,
  children,
}: {
  sorted: false | "asc" | "desc"
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
      onClick={onToggle}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ArrowUpDownIcon className="size-3.5" />
      )}
    </button>
  )
}

function ColumnFilter({ column }: { column: Column<DatasetRecordRow> }) {
  const { t } = useTranslation()
  const [value, setValue] = useState((column.getFilterValue() as string) ?? "")

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/60" />
      <Input
        className="h-7 pl-7 text-xs font-normal bg-background"
        placeholder={t("actions:search")}
        value={value}
        type="search"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          setValue(event.target.value)
          column.setFilterValue(event.target.value || undefined)
        }}
      />
    </div>
  )
}

function buildRecordColumns(
  schemaColumns: EvaluationExtractionDatasetSchemaColumn[],
  sorting: SortingState,
): ColumnDef<DatasetRecordRow>[] {
  const indexColumn: ColumnDef<DatasetRecordRow> = {
    id: "__rowIndex",
    header: ({ table }) => table.getRowModel().rows.length,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground/60 select-none">
        {row.original.__rowIndex + 1}
      </span>
    ),
    size: 48,
  }

  const dataColumns: ColumnDef<DatasetRecordRow>[] = schemaColumns.map((schemaColumn) => {
    const sortEntry = sorting.find((entry) => entry.id === schemaColumn.id)
    const sorted = sortEntry ? (sortEntry.desc ? ("desc" as const) : ("asc" as const)) : false

    return {
      id: schemaColumn.id,
      accessorKey: schemaColumn.id,
      header: ({ column: tableColumn }) => (
        <SortableHeader
          sorted={sorted}
          onToggle={() => tableColumn.toggleSorting(sorted === "asc")}
        >
          {schemaColumn.finalName}{" "}
          <Badge
            variant={
              schemaColumn.role === "input"
                ? "default"
                : schemaColumn.role === "target"
                  ? "success"
                  : "outline"
            }
          >
            {schemaColumn.role}
          </Badge>
        </SortableHeader>
      ),
      cell: ({ getValue }) => <span className="truncate block">{String(getValue() ?? "")}</span>,
      size: 200,
      minSize: 120,
      maxSize: 400,
    }
  })

  return [indexColumn, ...dataColumns]
}

export function EvaluationExtractionDatasetRecords({
  dataset,
}: {
  dataset: EvaluationExtractionDataset
}) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const schemaColumns = useMemo(
    () => Object.values(dataset.schemaMapping).sort((a, b) => a.index - b.index),
    [dataset.schemaMapping],
  )
  const data = useMemo(() => buildRecordRows(dataset), [dataset])
  const columns = useMemo(
    () => buildRecordColumns(schemaColumns, sorting),
    [schemaColumns, sorting],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const { rows } = table.getRowModel()
  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = data.length
  const isFiltered = columnFilters.length > 0

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = virtualRows[0]?.start ?? 0
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0

  const count = isFiltered ? filteredCount : totalCount
  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t("evaluation:dataset.records.view.title")}</CardTitle>
        <CardDescription>
          {t("evaluation:dataset.records.view.description", { count })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div ref={setScrollElement} className="flex-1 overflow-auto pb-6">
          <div className="rounded-lg border overflow-x-scroll">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10 [&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b transition-colors">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-foreground h-auto px-2 py-2 text-left align-bottom font-medium whitespace-nowrap"
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex flex-col gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanFilter() && <ColumnFilter column={header.column} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: paddingTop }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  if (!row) return null
                  return (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors hover:bg-muted/50 ${virtualRow.index % 2 !== 0 ? "bg-muted/30" : ""}`}
                      style={{ height: ROW_HEIGHT }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="p-2 align-middle whitespace-nowrap"
                          style={{
                            width: cell.column.getSize(),
                            maxWidth: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: paddingBottom }} />
                  </tr>
                )}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground p-2 align-middle"
                    >
                      {t("status:noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
