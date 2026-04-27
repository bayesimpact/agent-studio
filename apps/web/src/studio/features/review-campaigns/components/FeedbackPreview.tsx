import type { ReviewCampaignQuestionDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import { RadioGroup, RadioGroupItem } from "@caseai-connect/ui/shad/radio-group"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { StarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  perSessionQuestions: ReviewCampaignQuestionDto[]
  endOfPhaseQuestions: ReviewCampaignQuestionDto[]
}

function StarRatingPreview() {
  const { t } = useTranslation()
  return (
    <fieldset
      className="flex items-center gap-1 border-0 p-0"
      aria-label={t("reviewCampaigns:preview.ratingAria")}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="icon-sm"
          tabIndex={-1}
          aria-label={t("reviewCampaigns:preview.starsAria", { count: value })}
        >
          <StarIcon />
        </Button>
      ))}
    </fieldset>
  )
}

function QuestionPreview({ question }: { question: ReviewCampaignQuestionDto }) {
  const { t } = useTranslation()
  return (
    <Field>
      <FieldLabel htmlFor={`preview-${question.id}`}>
        {question.prompt || (
          <span className="text-muted-foreground italic">
            {t("reviewCampaigns:preview.untitled")}
          </span>
        )}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {question.type === "rating" && <StarRatingPreview />}
      {question.type === "free-text" && (
        <Textarea
          id={`preview-${question.id}`}
          rows={2}
          disabled
          placeholder={t("reviewCampaigns:preview.answerPlaceholder")}
        />
      )}
      {question.type === "single-choice" && (
        <RadioGroup disabled>
          {(question.options ?? []).map((option, index) => (
            <div key={`${question.id}-${option}-${index}`} className="flex items-center gap-2">
              <RadioGroupItem value={option} id={`${question.id}-${index}`} />
              <label htmlFor={`${question.id}-${index}`} className="text-sm">
                {option}
              </label>
            </div>
          ))}
          {(question.options ?? []).length === 0 && (
            <p className="text-muted-foreground text-sm italic">
              {t("reviewCampaigns:preview.noOptions")}
            </p>
          )}
        </RadioGroup>
      )}
    </Field>
  )
}

function PreviewSection({
  title,
  description,
  questions,
  includeOverallRating,
  includeComment,
}: {
  title: string
  description: string
  questions: ReviewCampaignQuestionDto[]
  includeOverallRating: boolean
  includeComment: boolean
}) {
  const { t } = useTranslation()
  return (
    <section className="rounded-lg border p-4 flex flex-col gap-4">
      <header>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      {includeOverallRating && (
        <Field>
          <FieldLabel>{t("reviewCampaigns:preview.overallRating")}</FieldLabel>
          <StarRatingPreview />
        </Field>
      )}

      {includeComment && (
        <Field>
          <FieldLabel htmlFor="preview-comment">{t("reviewCampaigns:preview.comment")}</FieldLabel>
          <Textarea
            id="preview-comment"
            rows={3}
            disabled
            placeholder={t("reviewCampaigns:preview.commentPlaceholder")}
          />
        </Field>
      )}

      {questions.map((question) => (
        <QuestionPreview key={question.id} question={question} />
      ))}

      {questions.length === 0 && !includeOverallRating && !includeComment && (
        <p className="text-muted-foreground text-sm italic">
          {t("reviewCampaigns:preview.noContent")}
        </p>
      )}

      <Field>
        <Input
          disabled
          value={t("reviewCampaigns:preview.submit")}
          readOnly
          className="max-w-fit"
        />
      </Field>
    </section>
  )
}

export function FeedbackPreview({ perSessionQuestions, endOfPhaseQuestions }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <PreviewSection
        title={t("reviewCampaigns:preview.perSessionTitle")}
        description={t("reviewCampaigns:preview.perSessionDescription")}
        questions={perSessionQuestions}
        includeOverallRating
        includeComment
      />
      <PreviewSection
        title={t("reviewCampaigns:preview.endOfPhaseTitle")}
        description={t("reviewCampaigns:preview.endOfPhaseDescription")}
        questions={endOfPhaseQuestions}
        includeOverallRating
        includeComment
      />
    </div>
  )
}
