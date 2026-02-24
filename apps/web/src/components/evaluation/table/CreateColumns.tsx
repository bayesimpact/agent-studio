import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TFunction } from "i18next"
import { ExternalLinkIcon } from "lucide-react"
import type { z } from "zod"
import { buildDate } from "@/utils/build-date"
import type { schema } from "./schema"

export function createColumns({ t }: { t: TFunction }): ColumnDef<z.infer<typeof schema>>[] {
  return [
    {
      accessorKey: "createdAt",
      header: t("table.headers.createdAt"),
      cell: ({ row }) => {
        return <div className="text-muted-foreground">{buildDate(row.original.createdAt)}</div>
      },
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: t("table.headers.status"),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5 select-none">
          {row.original.status === "done" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : row.original.status === "loading" ? (
            <IconLoader />
          ) : null}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "agent",
      header: t("table.headers.agent"),
      cell: ({ row }) => {
        return row.original.agent ? (
          // TODO: popover with agent details (model, temperature, etc.)
          <Button size="sm" variant="secondary">
            {row.original.agent?.name}
          </Button>
        ) : null
      },
      enableHiding: false,
    },
    {
      accessorKey: "output",
      header: t("table.headers.output"),
      cell: ({ row }) => {
        return <div className="max-w-52 whitespace-break-spaces">{row.original.output}</div>
      },
      enableHiding: false,
    },
    {
      accessorKey: "score",
      header: () => <div>{t("table.headers.score")}</div>,
      cell: ({ row }) => <Badge variant="secondary">{row.original.score}</Badge>,
    },
    {
      accessorKey: "traceUrl",
      header: () => <></>,
      cell: ({ row }) => (
        <Button asChild variant="ghost">
          <a href={row.original.traceUrl} className="cursor-pointer" target="_blank">
            Trace Url
            <ExternalLinkIcon className="size-4" />
          </a>
        </Button>
      ),
    },
  ]
}
