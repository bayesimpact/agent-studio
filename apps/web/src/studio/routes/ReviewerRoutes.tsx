import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { ReviewerCampaignLandingPage } from "@/studio/features/review-campaigns/reviewer/components/ReviewerCampaignLandingPage"
import { ReviewerMyCampaignsPage } from "@/studio/features/review-campaigns/reviewer/components/ReviewerMyCampaignsPage"
import { ReviewerSessionReviewPage } from "@/studio/features/review-campaigns/reviewer/components/ReviewerSessionReviewPage"
import { ReviewerRouteNames } from "./helpers"
import { ReviewerReportRoute } from "./ReviewerReportRoute"
import { ReviewerShell } from "./ReviewerShell"

export const reviewerRoutes = {
  element: (
    <ProtectedRoute>
      <ReviewerShell />
    </ProtectedRoute>
  ),
  children: [
    {
      path: ReviewerRouteNames.HOME,
      element: <ReviewerMyCampaignsPage />,
    },
    {
      path: ReviewerRouteNames.CAMPAIGN,
      element: <ReviewerCampaignLandingPage />,
    },
    {
      path: ReviewerRouteNames.REPORT,
      element: <ReviewerReportRoute />,
    },
    {
      path: ReviewerRouteNames.SESSION,
      element: <ReviewerSessionReviewPage />,
    },
  ],
}
