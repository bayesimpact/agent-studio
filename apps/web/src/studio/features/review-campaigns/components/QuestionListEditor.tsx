import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignQuestionType,
} from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { Switch } from "@caseai-connect/ui/shad/switch"
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react"

const QUESTION_TYPE_LABELS: Record<ReviewCampaignQuestionType, string> = {
  rating: "Rating (1–5)",
  "single-choice": "Single choice",
  "free-text": "Free text",
}

type Props = {
  label: string
  description?: string
  questions: ReviewCampaignQuestionDto[]
  onChange: (next: ReviewCampaignQuestionDto[]) => void
  disabled?: boolean
}

const makeEmptyQuestion = (): ReviewCampaignQuestionDto => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "rating",
  required: false,
})

export function QuestionListEditor({
  label,
  description,
  questions,
  onChange,
  disabled = false,
}: Props) {
  const update = (index: number, patch: Partial<ReviewCampaignQuestionDto>) => {
    onChange(
      questions.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...patch } : question,
      ),
    )
  }

  const remove = (index: number) => {
    onChange(questions.filter((_, currentIndex) => currentIndex !== index))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    const [removed] = next.splice(index, 1)
    if (!removed) return
    next.splice(target, 0, removed)
    onChange(next)
  }

  const add = () => {
    onChange([...questions, makeEmptyQuestion()])
  }

  return (
    <section className="flex flex-col gap-3">
      <header>
        <h3 className="text-sm font-semibold">{label}</h3>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </header>

      {questions.length === 0 && (
        <p className="text-muted-foreground text-sm italic">No questions yet.</p>
      )}

      <ol className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-md border p-3 flex flex-col gap-3"
            data-testid={`question-${index}`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <Field className="md:flex-1">
                <FieldLabel htmlFor={`prompt-${question.id}`}>Prompt</FieldLabel>
                <Input
                  id={`prompt-${question.id}`}
                  value={question.prompt}
                  disabled={disabled}
                  onChange={(event) => update(index, { prompt: event.target.value })}
                  placeholder="e.g. Was the response clear?"
                />
              </Field>

              <Field className="md:w-48">
                <FieldLabel htmlFor={`type-${question.id}`}>Type</FieldLabel>
                <Select
                  value={question.type}
                  disabled={disabled}
                  onValueChange={(value) =>
                    update(index, { type: value as ReviewCampaignQuestionType })
                  }
                >
                  <SelectTrigger id={`type-${question.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(QUESTION_TYPE_LABELS) as ReviewCampaignQuestionType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {QUESTION_TYPE_LABELS[type]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {question.type === "single-choice" && (
              <Field>
                <FieldLabel htmlFor={`options-${question.id}`}>Options (one per line)</FieldLabel>
                <Input
                  id={`options-${question.id}`}
                  value={(question.options ?? []).join(", ")}
                  disabled={disabled}
                  placeholder="Yes, No, Not sure"
                  onChange={(event) =>
                    update(index, {
                      options: event.target.value
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${question.id}`}
                  checked={question.required}
                  disabled={disabled}
                  onCheckedChange={(checked) => update(index, { required: checked })}
                />
                <label htmlFor={`required-${question.id}`} className="text-sm">
                  Required
                </label>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || index === questions.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  aria-label="Remove question"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={add}
        className="self-start"
      >
        <PlusIcon /> Add question
      </Button>
    </section>
  )
}
