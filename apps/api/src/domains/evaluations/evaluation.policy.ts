import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Evaluation } from "./evaluation.entity"

export class EvaluationPolicy extends ProjectScopedPolicy<Evaluation> {
  // we don't need any additional logic here, the default project-scoped policy is enough
}
