import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type z from "zod"
import { EvaluationsTable } from "@/components/evaluation/table/EvaluationsTable"
import type { schema } from "@/components/evaluation/table/schema"
import type { Agent } from "@/features/agents/agents.models"
import { selectEvaluationReportsForEvaluation } from "@/features/evaluation-reports/evaluation-reports.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

export function EvaluationReports({
  evaluationId,
  agents,
}: {
  evaluationId: string
  agents: Agent[]
}) {
  const { t } = useTranslation("common")
  const evaluationReports = useAppSelector(selectEvaluationReportsForEvaluation(evaluationId))

  if (ADS.isError(evaluationReports))
    return <div className="text-red-500">Failed to load evaluation reports</div>

  if (ADS.isFulfilled(evaluationReports)) {
    const data = evaluationReports.value.map(
      (report) =>
        ({
          id: report.id,
          agent: agents.find((agent) => agent.id === report.agentId) || undefined,
          status: report.output.trim().length === 0 ? "loading" : "done",
          output: report.output,
          score: report.score,
          createdAt: report.createdAt,
          traceUrl: report.traceUrl,
        }) satisfies z.infer<typeof schema>,
    )
    return <EvaluationsTable data={data} />
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Item variant="outline" className="w-fit">
        <ItemHeader>
          <ItemTitle className="w-fit text-primary">
            <Loader2Icon className="size-5 animate-spin " /> {t("loading")}
          </ItemTitle>
        </ItemHeader>
      </Item>
    </div>
  )
}
