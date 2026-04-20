import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useMemo } from "react"
import type { EvaluationExtractionDatasetFileColumn } from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"

function buildPreviewData(columns: EvaluationExtractionDatasetFileColumn[]) {
  const rowCount = Math.max(...columns.map((column) => column.values.length))
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: Record<string, string> = {}
    for (const column of columns) {
      row[column.id] = column.values[rowIndex] != null ? String(column.values[rowIndex]) : ""
    }
    return row
  })
}

function buildPreviewColumns(
  columns: EvaluationExtractionDatasetFileColumn[],
): ColumnDef<Record<string, string>>[] {
  return columns.map((column) => ({
    id: column.id,
    accessorKey: column.id,
    header: column.name,
    cell: ({ getValue }) => <span className="truncate">{getValue() as string}</span>,
    size: 180,
    minSize: 100,
    maxSize: 300,
  }))
}

export function FilePreview({ columns }: { columns: EvaluationExtractionDatasetFileColumn[] }) {
  const data = useMemo(() => buildPreviewData(columns), [columns])
  const tableColumns = useMemo(() => buildPreviewColumns(columns), [columns])
  const table = useReactTable({ data, columns: tableColumns, getCoreRowModel: getCoreRowModel() })
  const totalSize = table.getTotalSize()
  return (
    <div className="max-h-64 overflow-x-scroll rounded-md border">
      <table className="caption-bottom text-sm" style={{ minWidth: totalSize }}>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="truncate text-muted-foreground"
                  style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  )
}
