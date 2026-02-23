import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Checkbox } from "@caseai-connect/ui/shad/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { IconCircleCheckFilled, IconDotsVertical, IconLoader } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TFunction } from "i18next"
import type { z } from "zod"
import type { schema } from "./schema"

export function createColumns({
  t,
  onRunSelected,
  onDelete,
  onEdit,
}: {
  t: TFunction
  onRunSelected: (selectedIds: string[]) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}): ColumnDef<z.infer<typeof schema>>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t("table.ariaLabels.selectAll")}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("table.ariaLabels.selectRow")}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "input",
      header: t("table.headers.input"),
      cell: ({ row }) => {
        return <>{row.original.input}</>
      },
      enableHiding: false,
    },
    {
      accessorKey: "expectedOutput",
      header: t("table.headers.expectedOutput"),
      cell: ({ row }) => {
        return <>{row.original.expectedOutput}</>
      },
      enableHiding: false,
    },

    {
      accessorKey: "status",
      header: t("table.headers.status"),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "Done" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "output",
      header: t("table.headers.output"),
      cell: ({ row }) => {
        return <>{row.original.output}</>
      },
      enableHiding: false,
    },
    {
      accessorKey: "score",
      header: () => <div className="w-full text-right">{t("table.headers.score")}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Badge variant="secondary">{row.original.score}</Badge>
        </div>
      ),
    },
    {
      id: "run",
      header: () => <div>{t("table.buttons.run")}</div>,
      cell: ({ row }) => (
        <Button variant="default" size="sm" onClick={() => onRunSelected([row.id])}>
          {t("table.buttons.run")}
        </Button>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">{t("table.actions.openMenu")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit(row.id)}>
              {t("table.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.id)}>
              {t("table.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
