import type { Meta, StoryObj } from "@storybook/react-vite"
import { reactRouterParameters, withRouter } from "storybook-addon-remix-react-router"
import type { Project } from "@/common/features/projects/projects.models"
import { TesterCampaignLandingPage } from "@/tester/features/review-campaigns/components/TesterCampaignLandingPage"
import { TesterRouteNames } from "@/tester/routes/helpers"
import { withRedux } from "../../decorators/with-redux"
import { mockSessionSummaries, mockSessions, mockSurvey, mockTesterContext } from "./fixtures"
import { buildMockTesterService } from "./mock-service"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
}

const pathParams = {
  organizationId: "org-1",
  projectId: "proj-1",
  reviewCampaignId: mockTesterContext.id,
}

const meta = {
  title: "review-campaigns/tester/pages/TesterCampaignLandingPage",
  component: TesterCampaignLandingPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { pathParams },
      routing: { path: TesterRouteNames.CAMPAIGN },
    }),
  },
  decorators: [withRouter],
} satisfies Meta<typeof TesterCampaignLandingPage>

export default meta
type Story = StoryObj<typeof meta>

export const Fresh: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      testerLocalSessionsByCampaignId: {},
      servicesMock: { reviewCampaignsTester: buildMockTesterService() },
    }),
  ],
}

export const WithPastSessions: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      testerLocalSessionsByCampaignId: { [mockTesterContext.id]: mockSessions },
      servicesMock: {
        reviewCampaignsTester: buildMockTesterService({
          myTesterSessions: mockSessionSummaries,
        }),
      },
    }),
  ],
}

export const ParticipationFinished: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      testerLocalSessionsByCampaignId: { [mockTesterContext.id]: mockSessions },
      testerSurveyByCampaignId: { [mockTesterContext.id]: mockSurvey },
      servicesMock: {
        reviewCampaignsTester: buildMockTesterService({
          myTesterSessions: mockSessionSummaries,
          myTesterSurvey: mockSurvey,
        }),
      },
    }),
  ],
}
