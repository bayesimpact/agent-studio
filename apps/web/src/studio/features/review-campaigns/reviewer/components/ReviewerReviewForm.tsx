import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
  SubmitReviewerSessionReviewRequestDto,
} from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { useMemo, useState } from "react"
import { DynamicQuestionField } from "../../tester/components/DynamicQuestionField"
import { StarRatingInput } from "../../tester/components/StarRatingInput"

type AnswerValue = string | number | string[] | null

export type ReviewerReviewFormDefaults = {
  overallRating?: number | null
  comment?: string | null
  answers?: ReviewCampaignTesterFeedbackAnswerDto[]
}

type Props = {
  questions: ReviewCampaignQuestionDto[]
  defaults?: ReviewerReviewFormDefaults
  submitLabel?: string
  disabled?: boolean
  onSubmit: (payload: SubmitReviewerSessionReviewRequestDto) => void
}

/**
 * Reviewer-facing rating + comment + questions form. Mirrors the shape of
 * EndOfPhaseSurveyForm on the tester side. Used in both first-submission
 * (blind mode) and post-submit editing — the caller passes `defaults` when
 * editing an existing review.
 */
export function ReviewerReviewForm({
  questions,
  defaults,
  submitLabel = "Submit review",
  disabled = false,
  onSubmit,
}: Props) {
  const [overallRating, setOverallRating] = useState<number | null>(defaults?.overallRating ?? null)
  const [comment, setComment] = useState(defaults?.comment ?? "")
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    toAnswerRecord(defaults?.answers ?? []),
  )

  const missingRequired = useMemo(
    () =>
      questions.some(
        (question) =>
          question.required &&
          (answers[question.id] === undefined ||
            answers[question.id] === null ||
            answers[question.id] === ""),
      ),
    [questions, answers],
  )

  const canSubmit = !disabled && overallRating !== null && !missingRequired

  const handleSubmit = () => {
    if (overallRating === null) return
    onSubmit({
      overallRating,
      comment: comment.trim() === "" ? null : comment,
      answers: toAnswerList(answers),
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) handleSubmit()
      }}
    >
      <Field>
        <FieldLabel>
          Your rating <span className="text-destructive ml-1">*</span>
        </FieldLabel>
        <StarRatingInput
          value={overallRating}
          onChange={setOverallRating}
          disabled={disabled}
          aria-label="Reviewer overall rating"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="reviewer-comment">Comment</FieldLabel>
        <Textarea
          id="reviewer-comment"
          rows={4}
          disabled={disabled}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What worked, what didn't?"
        />
      </Field>

      {questions.map((question) => (
        <DynamicQuestionField
          key={question.id}
          question={question}
          value={answers[question.id] ?? null}
          disabled={disabled}
          onChange={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))}
        />
      ))}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function toAnswerRecord(
  answers: ReviewCampaignTesterFeedbackAnswerDto[],
): Record<string, AnswerValue> {
  const record: Record<string, AnswerValue> = {}
  for (const answer of answers) {
    record[answer.questionId] = answer.value
  }
  return record
}

function toAnswerList(
  answersByQuestionId: Record<string, AnswerValue>,
): ReviewCampaignTesterFeedbackAnswerDto[] {
  return Object.entries(answersByQuestionId)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([questionId, value]) => ({
      questionId,
      value: value as ReviewCampaignTesterFeedbackAnswerDto["value"],
    }))
}
