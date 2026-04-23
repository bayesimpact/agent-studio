import type { ReviewCampaignQuestionDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import { RadioGroup, RadioGroupItem } from "@caseai-connect/ui/shad/radio-group"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { StarIcon } from "lucide-react"

type Props = {
  perSessionQuestions: ReviewCampaignQuestionDto[]
  endOfPhaseQuestions: ReviewCampaignQuestionDto[]
}

function StarRatingPreview() {
  return (
    <fieldset className="flex items-center gap-1 border-0 p-0" aria-label="5-star rating (preview)">
      {[1, 2, 3, 4, 5].map((value) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="icon-sm"
          tabIndex={-1}
          aria-label={`${value} stars`}
        >
          <StarIcon />
        </Button>
      ))}
    </fieldset>
  )
}

function QuestionPreview({ question }: { question: ReviewCampaignQuestionDto }) {
  return (
    <Field>
      <FieldLabel htmlFor={`preview-${question.id}`}>
        {question.prompt || <span className="text-muted-foreground italic">Untitled</span>}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {question.type === "rating" && <StarRatingPreview />}
      {question.type === "free-text" && (
        <Textarea id={`preview-${question.id}`} rows={2} disabled placeholder="Tester answer…" />
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
            <p className="text-muted-foreground text-sm italic">No options configured.</p>
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
  return (
    <section className="rounded-lg border p-4 flex flex-col gap-4">
      <header>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      {includeOverallRating && (
        <Field>
          <FieldLabel>Overall rating</FieldLabel>
          <StarRatingPreview />
        </Field>
      )}

      {includeComment && (
        <Field>
          <FieldLabel htmlFor="preview-comment">Comment</FieldLabel>
          <Textarea id="preview-comment" rows={3} disabled placeholder="Tester comment…" />
        </Field>
      )}

      {questions.map((question) => (
        <QuestionPreview key={question.id} question={question} />
      ))}

      {questions.length === 0 && !includeOverallRating && !includeComment && (
        <p className="text-muted-foreground text-sm italic">No content yet.</p>
      )}

      <Field>
        <Input disabled value="Submit" readOnly className="max-w-fit" />
      </Field>
    </section>
  )
}

export function FeedbackPreview({ perSessionQuestions, endOfPhaseQuestions }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <PreviewSection
        title="After each session"
        description="What a tester sees when closing a session."
        questions={perSessionQuestions}
        includeOverallRating
        includeComment
      />
      <PreviewSection
        title="End-of-phase survey"
        description="What a tester sees when they finish participating."
        questions={endOfPhaseQuestions}
        includeOverallRating
        includeComment
      />
    </div>
  )
}
