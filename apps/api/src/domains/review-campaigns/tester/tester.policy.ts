import { BasePolicy } from "@/common/policies/base-policy"
import type { ReviewCampaignMembership } from "../memberships/review-campaign-membership.entity"
import type { ReviewCampaign } from "../review-campaign.entity"

type TesterPolicyContext = {
  reviewCampaign: ReviewCampaign
  reviewCampaignMembership: ReviewCampaignMembership | undefined
}

export class TesterPolicy extends BasePolicy<ReviewCampaign> {
  private readonly reviewCampaign: ReviewCampaign
  private readonly reviewCampaignMembership: ReviewCampaignMembership | undefined

  constructor(context: TesterPolicyContext) {
    // BasePolicy's organizationMembership is not relevant for tester auth — the
    // entire access check is (membership role on this campaign) × (campaign status).
    // We pass an unused organizationMembership stub to satisfy the signature; the
    // policy methods never read it.
    super({} as never, context.reviewCampaign)
    this.reviewCampaign = context.reviewCampaign
    this.reviewCampaignMembership = context.reviewCampaignMembership
  }

  // These BasePolicy methods are all gated by the same tester access rule;
  // overriding them lets controllers write `@CheckPolicy((p) => p.canCreate())`
  // (or canView/canUpdate/canList) and keep the @CheckPolicy handler type-safe.
  canList(): boolean {
    return this.canActAsTester()
  }

  canView(): boolean {
    return this.canActAsTester()
  }

  canCreate(): boolean {
    return this.canActAsTester()
  }

  canUpdate(): boolean {
    return this.canActAsTester()
  }

  canActAsTester(): boolean {
    return this.isActiveTesterMember() && this.isCampaignActive()
  }

  /**
   * Used only by `getTesterContext`, which is intentionally shared with the
   * reviewer landing page (campaign name / description / agent snapshot are
   * neutral metadata, and the tester per-session questions are already visible
   * to reviewers via blind review). Testers need an active campaign; reviewers
   * keep read access on closed campaigns too.
   */
  canViewSharedContext(): boolean {
    if (!this.reviewCampaignMembership) return false
    if (this.reviewCampaignMembership.campaignId !== this.reviewCampaign.id) return false
    if (this.reviewCampaignMembership.role === "tester") return this.isCampaignActive()
    if (this.reviewCampaignMembership.role === "reviewer") return this.isCampaignNotDraft()
    return false
  }

  private isActiveTesterMember(): boolean {
    return (
      !!this.reviewCampaignMembership &&
      this.reviewCampaignMembership.role === "tester" &&
      this.reviewCampaignMembership.campaignId === this.reviewCampaign.id
    )
  }

  private isCampaignActive(): boolean {
    return this.reviewCampaign.status === "active"
  }

  private isCampaignNotDraft(): boolean {
    return this.reviewCampaign.status !== "draft"
  }
}
