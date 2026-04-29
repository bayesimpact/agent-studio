import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { ReviewerSessionReviewPage } from "@/reviewer/features/review-campaigns/components/ReviewerSessionReviewPage"
import { ReviewerCampaignRoute } from "@/reviewer/routes/ReviewerCampaignRoute"
import { ReviewerRouteNames } from "./helpers"
import { ReviewerCampaignsRoute } from "./ReviewerCampaignsRoute"
import { ReviewerReportRoute } from "./ReviewerReportRoute"
import { ReviewerRoute } from "./ReviewerRoute"

export const reviewerRoutes = {
  element: (
    <ProtectedRoute>
      <ReviewerRoute />
    </ProtectedRoute>
  ),
  children: [
    {
      path: ReviewerRouteNames.HOME,
      element: <ReviewerCampaignsRoute />,
    },
    {
      path: ReviewerRouteNames.CAMPAIGN,
      element: <ReviewerCampaignRoute />,
    },
    {
      path: ReviewerRouteNames.REPORT,
      element: <ReviewerReportRoute />,
    },
    {
      path: ReviewerRouteNames.SESSION,
      // FIXME:
      element: <ReviewerSessionReviewPage />,
    },
  ],
}
