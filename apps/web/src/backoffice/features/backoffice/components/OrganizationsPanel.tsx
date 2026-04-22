import { type FeatureFlagKey, FeatureFlags } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
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
import { PlusIcon, XIcon } from "lucide-react"
import { useMemo, useState } from "react"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { useAppDispatch } from "@/common/store/hooks"
import { backofficeActions } from "../backoffice.slice"
import { SearchField, SortableHeader } from "./BackofficeTable"

type OrganizationRow = {
  organizationId: string
  organizationName: string
  projectId: string | null
  projectName: string
  featureFlags: FeatureFlagKey[]
}

export function OrganizationsPanel({ organizations }: { organizations: Organization[] }) {
  const dispatch = useAppDispatch()
  const [sorting, setSorting] = useState<SortingState>([{ id: "organizationName", desc: false }])
  const [globalFilter, setGlobalFilter] = useState("")

  const rows = useMemo<OrganizationRow[]>(
    () =>
      organizations.flatMap((organization): OrganizationRow[] => {
        if (organization.projects.length === 0) {
          return [
            {
              organizationId: organization.id,
              organizationName: organization.name,
              projectId: null,
              projectName: "",
              featureFlags: [],
            },
          ]
        }
        return organization.projects.map((project) => ({
          organizationId: organization.id,
          organizationName: organization.name,
          projectId: project.id,
          projectName: project.name,
          featureFlags: project.featureFlags as FeatureFlagKey[],
        }))
      }),
    [organizations],
  )

  const columns = useMemo<ColumnDef<OrganizationRow>[]>(
    () => [
      {
        accessorKey: "organizationName",
        header: ({ column }) => <SortableHeader column={column} label="Organization" />,
        cell: ({ row }) => <span className="font-medium">{row.original.organizationName}</span>,
      },
      {
        accessorKey: "projectName",
        header: ({ column }) => <SortableHeader column={column} label="Project" />,
        cell: ({ row }) =>
          row.original.projectId ? (
            row.original.projectName
          ) : (
            <span className="text-muted-foreground italic">No projects</span>
          ),
      },
      {
        id: "featureFlags",
        accessorFn: (row) => row.featureFlags.join(" "),
        enableSorting: false,
        header: () => <span className="text-muted-foreground">Feature flags</span>,
        cell: ({ row }) => {
          const { projectId, featureFlags } = row.original
          if (!projectId) return null
          return (
            <FeatureFlagCell
              enabledFlags={featureFlags}
              onAdd={(featureFlagKey) =>
                dispatch(backofficeActions.addFeatureFlag({ projectId, featureFlagKey }))
              }
              onRemove={(featureFlagKey) =>
                dispatch(backofficeActions.removeFeatureFlag({ projectId, featureFlagKey }))
              }
            />
          )
        },
      },
    ],
    [dispatch],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
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
          placeholder="Search organizations, projects, or flags…"
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

function FeatureFlagCell({
  enabledFlags,
  onAdd,
  onRemove,
}: {
  enabledFlags: FeatureFlagKey[]
  onAdd: (featureFlagKey: FeatureFlagKey) => void
  onRemove: (featureFlagKey: FeatureFlagKey) => void
}) {
  const availableFlags = useMemo(
    () => FeatureFlags.filter((flag) => !enabledFlags.includes(flag.key)),
    [enabledFlags],
  )
  return (
    <div className="flex flex-wrap items-center gap-2">
      {enabledFlags.map((flagKey) => (
        <Badge key={flagKey} variant="secondary" className="gap-1 pr-1">
          {flagKey}
          <button
            type="button"
            onClick={() => onRemove(flagKey)}
            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label={`Remove ${flagKey}`}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {availableFlags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusIcon className="h-3 w-3 mr-1" />
              Add flag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableFlags.map((flag) => (
              <DropdownMenuItem key={flag.key} onSelect={() => onAdd(flag.key)}>
                <div className="flex flex-col">
                  <span className="font-medium">{flag.key}</span>
                  <span className="text-xs text-muted-foreground">{flag.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
