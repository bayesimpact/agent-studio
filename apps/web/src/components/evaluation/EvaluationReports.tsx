import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type z from "zod"
import { EvaluationReportTable } from "@/components/evaluation/table/EvaluationReportTable"
import type { schema } from "@/components/evaluation/table/schema"
import type { Agent } from "@/features/agents/agents.models"
import type { EvaluationReport } from "@/features/evaluation-reports/evaluation-reports.models"
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
  const evaluationReports = useAppSelector(selectEvaluationReportsForEvaluation(evaluationId))

  if (ADS.isError(evaluationReports)) return <ErrorMessage />

  if (ADS.isFulfilled(evaluationReports)) {
    const data = buildData({ evaluationReports: evaluationReports.value, agents })
    return <EvaluationReportTable data={data} />
  }

  return <LoadingMessage />
}

function ErrorMessage() {
  return <div className="text-red-500">Failed to load evaluation reports</div>
}

function LoadingMessage() {
  const { t } = useTranslation("common")
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

function buildData({
  evaluationReports,
  agents,
}: {
  evaluationReports: EvaluationReport[]
  agents: Agent[]
}) {
  return evaluationReports
    .map((report) => {
      const agent = agents.find((agent) => agent.id === report.agentId)
      if (!agent) return null
      return {
        id: report.id,
        agent,
        status: report.output.trim().length === 0 ? "loading" : "done",
        output: report.output,
        score: report.score,
        createdAt: report.createdAt,
        traceUrl: report.traceUrl,
      } satisfies z.infer<typeof schema>
    })
    .filter((report) => report !== null) satisfies z.infer<typeof schema>[]
}
