import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common"
import type { EndpointRequestWithReviewCampaignMembership } from "@/common/context/request.interface"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CampaignReportPolicy } from "./campaign-report.policy"

@Injectable()
export class CampaignReportGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest() as EndpointRequestWithReviewCampaignMembership

    const policy = new CampaignReportPolicy({
      organizationMembership: request.organizationMembership,
      project: request.project,
      projectMembership: request.projectMembership,
      reviewCampaign: request.reviewCampaign,
      reviewCampaignMembership: request.reviewCampaignMembership,
    })

    if (!policy.canView()) {
      throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    }
    return true
  }
}
