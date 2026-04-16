import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { EvaluationExtractionRun } from "./evaluation-extraction-run.entity"

export class EvaluationExtractionRunPolicy extends ProjectScopedPolicy<EvaluationExtractionRun> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }
}
