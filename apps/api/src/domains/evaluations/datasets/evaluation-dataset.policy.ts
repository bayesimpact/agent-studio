import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { EvaluationDataset } from "./evaluation-dataset.entity"

export class EvaluationDatasetPolicy extends ProjectScopedPolicy<EvaluationDataset> {
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
