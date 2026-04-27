import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
} from "@caseai-connect/api-contracts"
import { AnswerList } from "./AnswerList"

type Props = {
  questions: ReviewCampaignQuestionDto[]
  answers: ReviewCampaignTesterFeedbackAnswerDto[]
}

export function FactualAnswersPanel({ questions, answers }: Props) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">Session facts</h3>
        <p className="text-muted-foreground text-xs">
          Objective answers the tester provided about this session.
        </p>
      </header>
      <AnswerList
        questions={questions}
        answers={answers}
        emptyLabel="No factual questions were configured for this campaign."
      />
    </section>
  )
}
