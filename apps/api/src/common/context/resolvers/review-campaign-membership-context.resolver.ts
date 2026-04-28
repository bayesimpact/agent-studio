import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ReviewCampaignMembership } from "@/domains/review-campaigns/memberships/review-campaign-membership.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithReviewCampaign,
  EndpointRequestWithReviewCampaignMembership,
} from "../request.interface"

@Injectable()
export class ReviewCampaignMembershipContextResolver implements ContextResolver {
  readonly resource = "reviewCampaignMembership" as const

  constructor(
    @InjectRepository(ReviewCampaignMembership)
    private readonly membershipRepository: Repository<ReviewCampaignMembership>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithCampaign = request as EndpointRequestWithReviewCampaign
    // Load both role-memberships for (campaign, user). A user can hold tester
    // AND reviewer roles on the same campaign; each domain guard reads the
    // field matching its role, and dual-role policies (e.g. shared landing
    // context, report access) consult both.
    const memberships = await this.membershipRepository.find({
      where: {
        campaignId: requestWithCampaign.reviewCampaign.id,
        userId: request.user.id,
      },
    })

    const requestWithMembership = request as EndpointRequestWithReviewCampaignMembership
    requestWithMembership.testerMembership = memberships.find(
      (membership) => membership.role === "tester",
    )
    requestWithMembership.reviewerMembership = memberships.find(
      (membership) => membership.role === "reviewer",
    )
  }
}
