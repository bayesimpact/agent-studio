import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TFunction } from "i18next"
import { ExternalLinkIcon } from "lucide-react"
import type { z } from "zod"
import { DefaultPromptDialog } from "@/components/agent/DefaultPromptDialog"
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
      header: t("table.headers.agent.agent"),
      cell: ({ row }) => {
        return row.original.agent ? (
          <div className="text-muted-foreground text-xs flex flex-col gap-1.5">
            <div>
              <span>{t("table.headers.agent.name", { colon: true })}</span>{" "}
              <span className="font-semibold">{row.original.agent.name}</span>
            </div>
            <div>
              <span>{t("table.headers.agent.model")}</span>{" "}
              <span className="font-semibold">{row.original.agent.model}</span>
            </div>
            <div>
              <span>{t("table.headers.agent.locale")}</span>{" "}
              <span className="font-semibold">{row.original.agent.locale}</span>
            </div>
            <div>
              <span>{t("table.headers.agent.temperature")}</span>{" "}
              <span className="font-semibold">{row.original.agent.temperature}</span>
            </div>
            <DefaultPromptDialog
              buttonProps={{ variant: "secondary", size: "sm", className: "w-fit" }}
              prompt={row.original.agent.defaultPrompt}
            />
          </div>
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
      cell: ({ row }) => {
        row.original.score ? <Badge>{row.original.score}</Badge> : null
      },
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
