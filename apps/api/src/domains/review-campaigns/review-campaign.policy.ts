import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ReviewCampaign } from "./review-campaign.entity"

export class ReviewCampaignPolicy extends ProjectScopedPolicy<ReviewCampaign> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canList()
  }

  canView(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canUpdate(): boolean {
    return this.canView()
  }

  canDelete(): boolean {
    return this.canView()
  }
}
