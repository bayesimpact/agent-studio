import type { ReviewCampaignQuestionDto } from "@caseai-connect/api-contracts"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { RadioGroup, RadioGroupItem } from "@caseai-connect/ui/shad/radio-group"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { StarRatingInput } from "./StarRatingInput"

type AnswerValue = string | number | string[] | null

type Props = {
  question: ReviewCampaignQuestionDto
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  disabled?: boolean
}

export function DynamicQuestionField({ question, value, onChange, disabled = false }: Props) {
  return (
    <Field>
      <FieldLabel htmlFor={`q-${question.id}`}>
        {question.prompt || <span className="text-muted-foreground italic">Untitled</span>}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>

      {question.type === "rating" && (
        <StarRatingInput
          aria-label={question.prompt || "Rating"}
          value={typeof value === "number" ? value : null}
          disabled={disabled}
          onChange={(next) => onChange(next)}
        />
      )}

      {question.type === "free-text" && (
        <Textarea
          id={`q-${question.id}`}
          rows={2}
          disabled={disabled}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {question.type === "single-choice" && (
        <RadioGroup
          value={typeof value === "string" ? value : undefined}
          disabled={disabled}
          onValueChange={(next) => onChange(next)}
        >
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
