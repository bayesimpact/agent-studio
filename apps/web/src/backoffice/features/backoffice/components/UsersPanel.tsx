import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import type { BackofficeUser } from "../backoffice.models"
import { SearchField, SortableHeader } from "./BackofficeTable"

type UserRow = {
  id: string
  email: string
  name: string
  organizationMemberships: BackofficeUser["organizationMemberships"]
  projectMemberships: BackofficeUser["projectMemberships"]
  agentMemberships: BackofficeUser["agentMemberships"]
  searchable: string
}

export function UsersPanel({ users }: { users: BackofficeUser[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "email", desc: false }])
  const [globalFilter, setGlobalFilter] = useState("")

  const rows = useMemo<UserRow[]>(
    () =>
      users.map((user) => {
        const searchable = [
          user.email,
          user.name ?? "",
          ...user.organizationMemberships.map(
            (membership) => `${membership.organizationName} ${membership.role}`,
          ),
          ...user.projectMemberships.map(
            (membership) => `${membership.projectName} ${membership.role}`,
          ),
          ...user.agentMemberships.map(
            (membership) => `${membership.agentName} ${membership.role}`,
          ),
        ].join(" ")
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          organizationMemberships: user.organizationMemberships,
          projectMemberships: user.projectMemberships,
          agentMemberships: user.agentMemberships,
          searchable,
        }
      }),
    [users],
  )

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => <SortableHeader column={column} label="User" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.email}</span>
            {row.original.name && (
              <span className="text-xs text-muted-foreground">{row.original.name}</span>
            )}
          </div>
        ),
      },
      {
        id: "organizations",
        enableSorting: false,
        accessorFn: (row) =>
          row.organizationMemberships
            .map((membership) => `${membership.organizationName} ${membership.role}`)
            .join(" "),
        header: () => <span className="text-muted-foreground">Organizations</span>,
        cell: ({ row }) => (
          <MembershipsCell
            items={row.original.organizationMemberships.map((membership) => ({
              key: membership.organizationId,
              name: membership.organizationName,
              role: membership.role,
            }))}
          />
        ),
      },
      {
        id: "projects",
        enableSorting: false,
        accessorFn: (row) =>
          row.projectMemberships
            .map((membership) => `${membership.projectName} ${membership.role}`)
            .join(" "),
        header: () => <span className="text-muted-foreground">Projects</span>,
        cell: ({ row }) => (
          <MembershipsCell
            items={row.original.projectMemberships.map((membership) => ({
              key: membership.projectId,
              name: membership.projectName,
              role: membership.role,
            }))}
          />
        ),
      },
      {
        id: "agents",
        enableSorting: false,
        accessorFn: (row) =>
          row.agentMemberships
            .map((membership) => `${membership.agentName} ${membership.role}`)
            .join(" "),
        header: () => <span className="text-muted-foreground">Agents</span>,
        cell: ({ row }) => (
          <MembershipsCell
            items={row.original.agentMemberships.map((membership) => ({
              key: membership.agentId,
              name: membership.agentName,
              role: membership.role,
            }))}
          />
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase().trim()
      if (!query) return true
      return row.original.searchable.toLowerCase().includes(query)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      <div className="p-4 border-b">
        <SearchField
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search users, organizations, projects, or agents…"
        />
      </div>
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}

function MembershipsCell({ items }: { items: { key: string; name: string; role: string }[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground italic">—</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <Badge key={item.key} variant="secondary" className="gap-1">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-muted-foreground">({item.role})</span>
        </Badge>
      ))}
    </div>
  )
}
