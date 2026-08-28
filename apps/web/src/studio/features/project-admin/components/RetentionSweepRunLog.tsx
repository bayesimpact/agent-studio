import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@caseai-connect/ui/shad/tooltip"
import { format } from "date-fns"
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
      <TableCell>{format(run.ranAt, "PPp", { locale })}</TableCell>
      <TableCell>{run.purgedCount}</TableCell>
      <TableCell>
        {/* The run report shows on hover of the status badge. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={STATUS_VARIANTS[run.status]}>{run.status}</Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <MarkdownWrapper content={run.report} />
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
