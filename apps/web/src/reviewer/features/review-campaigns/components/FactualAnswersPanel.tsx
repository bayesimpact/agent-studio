import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
} from "@caseai-connect/api-contracts"
import { useTranslation } from "react-i18next"
import { AnswerList } from "./AnswerList"

type Props = {
  questions: ReviewCampaignQuestionDto[]
  answers: ReviewCampaignTesterFeedbackAnswerDto[]
}

export function FactualAnswersPanel({ questions, answers }: Props) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">{t("reviewerCampaigns:factualAnswers.title")}</h3>
        <p className="text-muted-foreground text-xs">
          {t("reviewerCampaigns:factualAnswers.description")}
        </p>
      </header>
      <AnswerList
        questions={questions}
        answers={answers}
        emptyLabel={t("reviewerCampaigns:factualAnswers.empty")}
      />
    </section>
  )
}
