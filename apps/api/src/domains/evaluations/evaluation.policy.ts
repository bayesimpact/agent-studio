import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Evaluation } from "./evaluation.entity"

export class EvaluationPolicy extends ProjectScopedPolicy<Evaluation> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canList()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }
}
