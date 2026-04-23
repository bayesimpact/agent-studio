import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { EndOfPhaseSurveyForm } from "@/studio/features/review-campaigns/tester/components/EndOfPhaseSurveyForm"
import { FinishParticipatingDialog } from "@/studio/features/review-campaigns/tester/components/FinishParticipatingDialog"
import { mockEndOfPhaseQuestions } from "./fixtures"

const meta = {
  title: "review-campaigns/tester/EndOfPhaseSurvey",
  parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj

export const FreshForm: Story = {
  render: () => (
    <EndOfPhaseSurveyForm questions={mockEndOfPhaseQuestions} onSubmit={fn()} onCancel={fn()} />
  ),
}

export const PrefilledForm: Story = {
  render: () => (
    <EndOfPhaseSurveyForm
      questions={mockEndOfPhaseQuestions}
      defaults={{
        overallRating: 4,
        comment: "Overall good, faster responses would help.",
        answers: [
          { questionId: "eop-1", value: 4 },
          { questionId: "eop-2", value: "Definitely" },
        ],
      }}
      onSubmit={fn()}
      onCancel={fn()}
      submitLabel="Save changes"
    />
  ),
}

export const ConfirmDialog: Story = {
  parameters: { layout: "centered" },
  render: () => <FinishParticipatingDialog open onConfirm={fn()} onCancel={fn()} />,
}
