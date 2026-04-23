import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { TesterAgentSessionPage } from "@/studio/features/review-campaigns/tester/components/TesterAgentSessionPage"
import { TesterCampaignLandingPage } from "@/studio/features/review-campaigns/tester/components/TesterCampaignLandingPage"
import { TesterEndOfPhaseSurveyPage } from "@/studio/features/review-campaigns/tester/components/TesterEndOfPhaseSurveyPage"
import { TesterMyCampaignsPage } from "@/studio/features/review-campaigns/tester/components/TesterMyCampaignsPage"
import { TesterRouteNames } from "./helpers"
import { TesterShell } from "./TesterShell"

export const testerRoutes = {
  element: (
    <ProtectedRoute>
      <TesterShell />
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
