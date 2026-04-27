import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
} from "@caseai-connect/api-contracts"
import { StarIcon } from "lucide-react"

type Props = {
  questions: ReviewCampaignQuestionDto[]
  answers: ReviewCampaignTesterFeedbackAnswerDto[]
  emptyLabel?: string
}

/**
 * Read-only pairing of questions with their answers. Used by both the
 * blind-mode factual panel and the post-submit tester-feedback panel.
 * Questions without a matching answer render a "not answered" placeholder.
 */
export function AnswerList({ questions, answers, emptyLabel = "No answers." }: Props) {
  if (questions.length === 0) {
    return <p className="text-muted-foreground text-sm italic">{emptyLabel}</p>
  }
  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.value] as const),
  )
  return (
    <dl className="flex flex-col gap-3">
      {questions.map((question) => {
        const answer = answerByQuestionId.get(question.id)
        return (
          <div key={question.id} className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">{question.prompt}</dt>
            <dd className="text-sm">{renderAnswer(question, answer)}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function renderAnswer(
  question: ReviewCampaignQuestionDto,
  answer: ReviewCampaignTesterFeedbackAnswerDto["value"] | undefined,
): React.ReactNode {
  if (answer === undefined || answer === null || answer === "") {
    return <span className="text-muted-foreground italic">Not answered</span>
  }
  if (question.type === "rating" && typeof answer === "number") {
    return (
      <span role="img" className="flex items-center gap-1" aria-label={`Rated ${answer} out of 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            // biome-ignore lint/suspicious/noArrayIndexKey: five fixed stars, no reorder
            key={index}
            className={
              index < answer ? "fill-primary text-primary size-4" : "text-muted-foreground size-4"
            }
          />
        ))}
        <span className="text-muted-foreground ml-1 text-xs">{answer}/5</span>
      </span>
    )
  }
  if (Array.isArray(answer)) {
    return answer.join(", ")
  }
  return String(answer)
}
