import type { Meta, StoryObj } from "@storybook/react-vite"
import { QuestionDistributionChart } from "@/studio/features/review-campaigns/reports/components/QuestionDistributionChart"
import { mockReviewerDistributions, mockTesterPerSessionDistributions } from "./fixtures"

const meta = {
  title: "review-campaigns/reports/QuestionDistributionChart",
  component: QuestionDistributionChart,
  parameters: { layout: "padded" },
} satisfies Meta<typeof QuestionDistributionChart>

export default meta
type Story = StoryObj<typeof meta>

export const Rating: Story = {
  args: { distribution: mockTesterPerSessionDistributions[0]! },
}

export const SingleChoice: Story = {
  args: { distribution: mockTesterPerSessionDistributions[2]! },
}

export const FreeText: Story = {
  args: { distribution: mockTesterPerSessionDistributions[1]! },
}

export const ReviewerSkew: Story = {
  args: { distribution: mockReviewerDistributions[0]! },
}

export const NoResponses: Story = {
  args: {
    distribution: {
      questionId: "empty",
      prompt: "Has anyone answered yet?",
      type: "rating",
      responseCount: 0,
      buckets: [
        { label: "1", count: 0 },
        { label: "2", count: 0 },
        { label: "3", count: 0 },
        { label: "4", count: 0 },
        { label: "5", count: 0 },
      ],
    },
  },
}
