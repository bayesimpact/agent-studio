import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterFeedbackAnswerDto,
} from "@caseai-connect/api-contracts"
import { StarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AnswerList } from "./AnswerList"

type Props = {
  questions: ReviewCampaignQuestionDto[]
  feedback: {
    overallRating: number
    comment: string | null
    answers: ReviewCampaignTesterFeedbackAnswerDto[]
  } | null
}

export function TesterFeedbackPanel({ questions, feedback }: Props) {
  const { t } = useTranslation()
  if (!feedback) {
    return (
      <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">{t("reviewerCampaigns:testerFeedback.title")}</h3>
        <p className="text-muted-foreground text-sm italic">
          {t("reviewerCampaigns:testerFeedback.empty")}
        </p>
      </section>
    )
  }
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <header>
        <h3 className="text-sm font-semibold">{t("reviewerCampaigns:testerFeedback.title")}</h3>
      </header>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">
          {t("reviewerCampaigns:testerFeedback.overallRating")}
        </span>
        <span
          role="img"
          className="flex items-center gap-1"
          aria-label={t("reviewerCampaigns:testerFeedback.ratingAriaLabel", {
            rating: feedback.overallRating,
          })}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              // biome-ignore lint/suspicious/noArrayIndexKey: five fixed stars
              key={index}
              className={
                index < feedback.overallRating
                  ? "fill-primary text-primary size-5"
                  : "text-muted-foreground size-5"
              }
            />
          ))}
          <span className="text-muted-foreground ml-2 text-xs">{feedback.overallRating}/5</span>
        </span>
      </div>
      {feedback.comment && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">
            {t("reviewerCampaigns:testerFeedback.comment")}
          </span>
          <p className="text-sm">{feedback.comment}</p>
        </div>
      )}
      {questions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            {t("reviewerCampaigns:testerFeedback.perSessionAnswers")}
          </span>
          <AnswerList questions={questions} answers={feedback.answers} />
        </div>
      )}
    </section>
  )
}
