import type { Meta, StoryObj } from "@storybook/react-vite"
import { reactRouterParameters, withRouter } from "storybook-addon-remix-react-router"
import type { Project } from "@/common/features/projects/projects.models"
import { TesterEndOfPhaseSurveyPage } from "@/tester/features/review-campaigns/components/TesterEndOfPhaseSurveyPage"
import { TesterRouteNames } from "@/tester/routes/helpers"
import { withRedux } from "../../decorators/with-redux"
import { mockSurvey, mockTesterContext } from "./fixtures"
import { buildMockTesterService } from "./mock-service"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
  agentCategories: [],
}

const pathParams = {
  organizationId: "org-1",
  projectId: "proj-1",
  reviewCampaignId: mockTesterContext.id,
}

const meta = {
  title: "review-campaigns/tester/pages/TesterEndOfPhaseSurveyPage",
  component: TesterEndOfPhaseSurveyPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { pathParams },
      routing: { path: TesterRouteNames.SURVEY },
    }),
  },
  decorators: [withRouter],
} satisfies Meta<typeof TesterEndOfPhaseSurveyPage>

export default meta
type Story = StoryObj<typeof meta>

export const FirstTime: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      servicesMock: { reviewCampaignsTester: buildMockTesterService() },
    }),
  ],
}

const editingSurvey = {
  ...mockSurvey,
  comment: "Overall good, faster responses would help.",
  answers: [{ questionId: "eop-1", value: 4 }],
}

export const Editing: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      testerSurveyByCampaignId: { [mockTesterContext.id]: editingSurvey },
      servicesMock: {
        reviewCampaignsTester: buildMockTesterService({ myTesterSurvey: editingSurvey }),
      },
    }),
  ],
}
