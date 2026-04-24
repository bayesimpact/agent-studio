import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ReviewerReviewForm } from "@/studio/features/review-campaigns/reviewer/components/ReviewerReviewForm"
import { mockReviewerQuestions } from "./fixtures"

const meta = {
  title: "review-campaigns/reviewer/ReviewerReviewForm",
  component: ReviewerReviewForm,
  parameters: { layout: "padded" },
  args: {
    onSubmit: fn(),
    questions: mockReviewerQuestions,
  },
} satisfies Meta<typeof ReviewerReviewForm>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyFirstSubmit: Story = {
  args: {
    submitLabel: "Submit review",
  },
}

export const EditingExistingReview: Story = {
  args: {
    submitLabel: "Save changes",
    defaults: {
      overallRating: 4,
      comment: "Solid answer, a bit long-winded.",
      answers: [
        { questionId: "rv-1", value: 4 },
        { questionId: "rv-2", value: "No" },
        { questionId: "rv-3", value: "The agent handled the follow-up question well." },
      ],
    },
  },
}

export const ReadOnlyClosedCampaign: Story = {
  args: {
    disabled: true,
    submitLabel: "Save changes",
    defaults: {
      overallRating: 3,
      comment: "Campaign is closed — this review is locked.",
      answers: [{ questionId: "rv-1", value: 3 }],
    },
  },
}
