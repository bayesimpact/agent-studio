import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { CampaignLanding } from "@/tester/features/review-campaigns/components/CampaignLanding"
import { mockSessions, mockTesterContext } from "./fixtures"

const meta = {
  title: "review-campaigns/tester/CampaignLanding",
  component: CampaignLanding,
  parameters: { layout: "fullscreen" },
  args: {
    context: mockTesterContext,
    onStartSession: fn(),
    onOpenFeedback: fn(),
    onResumeSession: fn(),
    onFinishParticipating: fn(),
    onEditSurvey: fn(),
  },
} satisfies Meta<typeof CampaignLanding>

export default meta
type Story = StoryObj<typeof meta>

export const Fresh: Story = {
  args: {
    sessions: [],
    participationFinished: false,
  },
}

export const WithPastSessions: Story = {
  args: {
    sessions: mockSessions,
    participationFinished: false,
  },
}

export const ParticipationFinished: Story = {
  args: {
    sessions: mockSessions,
    participationFinished: true,
  },
}
