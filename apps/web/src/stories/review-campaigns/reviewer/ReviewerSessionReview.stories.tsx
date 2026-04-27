import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ReviewerSessionReview } from "@/reviewer/features/review-campaigns/components/ReviewerSessionReview"
import {
  mockBlindFormSession,
  mockBlindSession,
  mockBlindSessionWithOtherReviewers,
  mockFullFormSession,
  mockFullFormSessionAbandoned,
  mockFullSession,
  mockFullSessionNoTesterFeedback,
  mockFullSessionWithOtherReviewers,
} from "./fixtures"

const meta = {
  title: "review-campaigns/reviewer/ReviewerSessionReview",
  component: ReviewerSessionReview,
  parameters: { layout: "padded" },
  args: {
    onSubmitReview: fn(),
    onUpdateReview: fn(),
  },
} satisfies Meta<typeof ReviewerSessionReview>

export default meta
type Story = StoryObj<typeof meta>

export const BlindFirstVisit: Story = {
  args: { session: mockBlindSession },
}

export const BlindWithOtherReviewers: Story = {
  args: { session: mockBlindSessionWithOtherReviewers },
}

export const PostSubmitAlone: Story = {
  args: { session: mockFullSession },
}

export const PostSubmitWithOtherReviewers: Story = {
  args: { session: mockFullSessionWithOtherReviewers },
}

export const PostSubmitNoTesterFeedback: Story = {
  args: { session: mockFullSessionNoTesterFeedback },
}

export const BlindFormSession: Story = {
  args: { session: mockBlindFormSession },
}

export const PostSubmitFormSession: Story = {
  args: { session: mockFullFormSession },
}

export const PostSubmitFormSessionAbandoned: Story = {
  args: { session: mockFullFormSessionAbandoned },
}
