import type { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { ReviewCampaignMembership } from "../memberships/review-campaign-membership.entity"
import type { ReviewCampaign } from "../review-campaign.entity"
import { ReviewCampaignPolicy } from "../review-campaign.policy"
import { ReviewerPolicy } from "../reviewer/reviewer.policy"

type CampaignReportPolicyContext = {
  organizationMembership: OrganizationMembership
  project: Project | undefined
  projectMembership: ProjectMembership | undefined
  reviewCampaign: ReviewCampaign
  reviewerMembership: ReviewCampaignMembership | undefined
}

/**
 * Report access is dual-role: either a project admin/owner viewing from the
 * campaign editor, or an accepted reviewer viewing from the reviewer landing.
 * Testers intentionally don't see the report.
 */
export class CampaignReportPolicy {
  constructor(private readonly context: CampaignReportPolicyContext) {}

  canView(): boolean {
    return this.canViewAsAdmin() || this.canViewAsReviewer()
  }

  private canViewAsAdmin(): boolean {
    const adminPolicy = new ReviewCampaignPolicy(
      {
        organizationMembership: this.context.organizationMembership,
        project: this.context.project,
        projectMembership: this.context.projectMembership,
      },
      this.context.reviewCampaign,
    )
    return adminPolicy.canView()
  }

  private canViewAsReviewer(): boolean {
    const reviewerPolicy = new ReviewerPolicy({
      reviewCampaign: this.context.reviewCampaign,
      reviewerMembership: this.context.reviewerMembership,
    })
    return reviewerPolicy.canView()
  }
}
