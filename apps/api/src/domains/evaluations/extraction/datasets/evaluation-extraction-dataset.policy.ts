import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { EvaluationExtractionDataset } from "./evaluation-extraction-dataset.entity"

export class EvaluationExtractionDatasetPolicy extends ProjectScopedPolicy<EvaluationExtractionDataset> {
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
