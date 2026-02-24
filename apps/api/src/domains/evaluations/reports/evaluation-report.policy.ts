import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { EvaluationReport } from "./evaluation-report.entity"

export class EvaluationReportPolicy extends ProjectScopedPolicy<EvaluationReport> {
  // we don't need any additional logic here, the default project-scoped policy is enough
}
