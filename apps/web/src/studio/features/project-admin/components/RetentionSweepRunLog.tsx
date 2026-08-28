import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { format } from "date-fns"
import { ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/components/MarkdownWrapper"
import type {
  RetentionSweepRun,
  RetentionSweepRunStatus,
  RetentionSweepRuns,
} from "@/common/features/projects/projects.models"
import { getLocale } from "@/common/utils/get-locale"

const STATUS_VARIANTS: Record<RetentionSweepRunStatus, "success" | "warning" | "destructive"> = {
  OK: "success",
  PARTIAL: "warning",
  ERROR: "destructive",
}

export function RetentionSweepRunLog({ log }: { log: RetentionSweepRuns }) {
  const { t } = useTranslation()
  const locale = getLocale()

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">{t("projectAdmin:retention.logTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("projectAdmin:retention.nextRun", {
            date: format(log.nextRunAt, "PPp", { locale }),
          })}
        </p>
      </div>
      {log.runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectAdmin:retention.logEmpty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("projectAdmin:retention.columnDate")}</TableHead>
              <TableHead>{t("projectAdmin:retention.columnPurged")}</TableHead>
              <TableHead>{t("projectAdmin:retention.columnStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {log.runs.map((run) => (
              <RetentionSweepRunRow key={run.id} run={run} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function RetentionSweepRunRow({ run }: { run: RetentionSweepRun }) {
  const locale = getLocale()

  return (
    <TableRow>
      <TableCell className="align-top">{format(run.ranAt, "PPp", { locale })}</TableCell>
      <TableCell className="align-top">{run.purgedCount}</TableCell>
      <TableCell>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1">
            <Badge variant={STATUS_VARIANTS[run.status]}>{run.status}</Badge>
            <ChevronRightIcon className="size-3 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-2 text-sm text-muted-foreground">
            <MarkdownWrapper content={run.report} />
          </div>
        </details>
      </TableCell>
    </TableRow>
  )
}
