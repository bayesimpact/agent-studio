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
    const membership =
      (await this.membershipRepository.findOne({
        where: {
          campaignId: requestWithCampaign.reviewCampaign.id,
          userId: request.user.id,
          role: "tester",
        },
      })) ?? undefined

    const requestWithMembership = request as EndpointRequestWithReviewCampaignMembership
    requestWithMembership.reviewCampaignMembership = membership
  }
}
