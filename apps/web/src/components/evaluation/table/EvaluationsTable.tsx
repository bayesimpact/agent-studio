"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"
import { useTranslation } from "react-i18next"
import type { z } from "zod"
import { createColumns } from "./CreateColumns"
import { Paginator } from "./Paginator"
import type { schema } from "./schema"

export function EvaluationsTable({
  data: initialData,
  children,
  onRunSelected,
  onDelete,
  onEdit,
}: {
  data: z.infer<typeof schema>[]
  children?: React.ReactNode
  onRunSelected: (selectedIds: string[]) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const { t } = useTranslation("evaluation")
  const [data, _setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns = createColumns({ t, onRunSelected, onDelete, onEdit })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const selectedRowIds = table.getFilteredSelectedRowModel().rows.map((row) => row.id)

  const noSelected = selectedRowIds.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-between">
        {children}

        <Button
          variant="default"
          size="sm"
          disabled={data.length === 0}
          onClick={() => onRunSelected(noSelected ? initialData.map((d) => d.id) : selectedRowIds)}
        >
          {noSelected ? t("table.buttons.runAll") : t("table.buttons.runSelected")}{" "}
          {!noSelected && `(${selectedRowIds.length})`}
        </Button>
      </div>

      <div className="w-full rounded-lg z-0 border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Paginator table={table} t={t} />
    </div>
  )
}
