import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ReviewCampaign } from "@/domains/review-campaigns/review-campaign.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithProject,
  EndpointRequestWithReviewCampaign,
} from "../request.interface"

@Injectable()
export class ReviewCampaignContextResolver implements ContextResolver {
  readonly resource = "reviewCampaign" as const

  constructor(
    @InjectRepository(ReviewCampaign)
    private readonly reviewCampaignRepository: Repository<ReviewCampaign>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { reviewCampaignId?: string }
    }
    const reviewCampaignId = requestWithParams.params?.reviewCampaignId

    if (!reviewCampaignId || reviewCampaignId === ":reviewCampaignId") {
      throw new NotFoundException()
    }

    const requestWithProject = request as EndpointRequestWithProject
    const reviewCampaign =
      (await this.reviewCampaignRepository.findOne({
        where: {
          id: reviewCampaignId,
          organizationId: requestWithProject.organizationId,
          projectId: requestWithProject.project.id,
        },
      })) ?? undefined
    if (!reviewCampaign) throw new NotFoundException()

    const requestWithReviewCampaign = request as EndpointRequestWithReviewCampaign
    requestWithReviewCampaign.reviewCampaign = reviewCampaign
  }
}
