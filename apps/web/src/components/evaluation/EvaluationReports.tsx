import type z from "zod"
import { EvaluationReportTable } from "@/components/evaluation/table/EvaluationReportTable"
import type { schema } from "@/components/evaluation/table/schema"
import type { Agent } from "@/features/agents/agents.models"
import type { EvaluationReport } from "@/features/evaluation-reports/evaluation-reports.models"
import { selectEvaluationReportsForEvaluation } from "@/features/evaluation-reports/evaluation-reports.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { Loader } from "../Loader"

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
    const key = data.map((report) => report.id).join("-")
    return <EvaluationReportTable key={key} data={data} />
  }

  return <Loader />
}

function ErrorMessage() {
  return <div className="text-red-500">Failed to load evaluation reports</div>
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
