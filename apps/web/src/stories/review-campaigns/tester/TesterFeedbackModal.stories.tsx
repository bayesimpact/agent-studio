import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { TesterFeedbackModal } from "@/tester/features/review-campaigns/components/TesterFeedbackModal"
import { mockPerSessionQuestions } from "./fixtures"

const meta = {
  title: "review-campaigns/tester/TesterFeedbackModal",
  component: TesterFeedbackModal,
  parameters: { layout: "centered" },
  args: {
    open: true,
    onSubmit: fn(),
    onAbandon: fn(),
  },
} satisfies Meta<typeof TesterFeedbackModal>

export default meta
type Story = StoryObj<typeof meta>

export const WithQuestions: Story = {
  args: {
    questions: mockPerSessionQuestions,
  },
}

export const OverallRatingOnly: Story = {
  args: {
    questions: [],
  },
}
