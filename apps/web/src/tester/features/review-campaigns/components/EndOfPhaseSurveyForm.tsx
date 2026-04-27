import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
  SubmitTesterCampaignSurveyRequestDto,
} from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { DynamicQuestionField } from "./DynamicQuestionField"
import { StarRatingInput } from "./StarRatingInput"

type AnswerValue = string | number | string[] | null

export type EndOfPhaseSurveyDefaults = {
  overallRating?: number | null
  comment?: string | null
  answers?: ReviewCampaignTesterFeedbackAnswerDto[]
}

type Props = {
  questions: ReviewCampaignQuestionDto[]
  defaults?: EndOfPhaseSurveyDefaults
  onSubmit: (payload: SubmitTesterCampaignSurveyRequestDto) => void
  onCancel?: () => void
  submitLabel?: string
}

export function EndOfPhaseSurveyForm({
  questions,
  defaults,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const { t } = useTranslation()
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

  const canSubmit = overallRating !== null && !missingRequired

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
      className="flex flex-col gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) handleSubmit()
      }}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("testerCampaigns:endOfPhaseForm.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("testerCampaigns:endOfPhaseForm.description")}
        </p>
      </header>

      <Field>
        <FieldLabel>
          {t("testerCampaigns:endOfPhaseForm.overallRating")}{" "}
          <span className="text-destructive ml-1">*</span>
        </FieldLabel>
        <StarRatingInput
          value={overallRating}
          onChange={setOverallRating}
          aria-label={t("testerCampaigns:endOfPhaseForm.overallRatingAriaLabel")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="survey-comment">
          {t("testerCampaigns:endOfPhaseForm.comment")}
        </FieldLabel>
        <Textarea
          id="survey-comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("testerCampaigns:endOfPhaseForm.commentPlaceholder")}
        />
      </Field>

      {questions.map((question) => (
        <DynamicQuestionField
          key={question.id}
          question={question}
          value={answers[question.id] ?? null}
          onChange={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))}
        />
      ))}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("testerCampaigns:endOfPhaseForm.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {submitLabel ?? t("testerCampaigns:endOfPhaseForm.submit")}
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
