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
    // Find any membership for (campaign, user). Policies check the role —
    // TesterPolicy wants role=tester, ReviewerPolicy wants role=reviewer.
    // A user with both roles on the same campaign picks up whichever row
    // the DB returns first; we refine this (array or role-hinted resolver)
    // when that edge case becomes load-bearing.
    const membership =
      (await this.membershipRepository.findOne({
        where: {
          campaignId: requestWithCampaign.reviewCampaign.id,
          userId: request.user.id,
        },
      })) ?? undefined

    const requestWithMembership = request as EndpointRequestWithReviewCampaignMembership
    requestWithMembership.reviewCampaignMembership = membership
  }
}
