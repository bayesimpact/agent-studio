import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { TesterAgentSessionPage } from "@/tester/features/review-campaigns/components/TesterAgentSessionPage"
import { TesterCampaignLandingPage } from "@/tester/features/review-campaigns/components/TesterCampaignLandingPage"
import { TesterEndOfPhaseSurveyPage } from "@/tester/features/review-campaigns/components/TesterEndOfPhaseSurveyPage"
import { TesterMyCampaignsPage } from "@/tester/features/review-campaigns/components/TesterMyCampaignsPage"
import { TesterRouteNames } from "./helpers"
import { TesterRoute } from "./TesterRoute"

// FIXME:
export const testerRoutes = {
  element: (
    <ProtectedRoute>
      <TesterRoute />
    </ProtectedRoute>
  ),
  children: [
    {
      path: TesterRouteNames.HOME,
      element: <TesterMyCampaignsPage />,
    },
    {
      path: TesterRouteNames.CAMPAIGN,
      element: <TesterCampaignLandingPage />,
    },
    {
      path: TesterRouteNames.SESSION,
      element: <TesterAgentSessionPage />,
    },
    {
      path: TesterRouteNames.SURVEY,
      element: <TesterEndOfPhaseSurveyPage />,
    },
  ],
}
