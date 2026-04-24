import type {
  ReviewCampaignQuestionDto,
  ReviewerSessionReviewDto,
} from "@caseai-connect/api-contracts"
import { StarIcon } from "lucide-react"
import { AnswerList } from "./AnswerList"

type Props = {
  reviews: ReviewerSessionReviewDto[]
  reviewerQuestions: ReviewCampaignQuestionDto[]
}

const shortenId = (id: string) => `${id.slice(0, 8)}…`

export function OtherReviewersPanel({ reviews, reviewerQuestions }: Props) {
  if (reviews.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">Other reviewers</h3>
        <p className="text-muted-foreground text-sm italic">
          You are the only reviewer on this session so far.
        </p>
      </section>
    )
  }
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <header>
        <h3 className="text-sm font-semibold">Other reviewers ({reviews.length})</h3>
      </header>
      <ol className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Reviewer {shortenId(review.reviewerUserId)}
              </span>
              <span
                role="img"
                className="flex items-center gap-0.5"
                aria-label={`Rated ${review.overallRating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    // biome-ignore lint/suspicious/noArrayIndexKey: five fixed stars
                    key={index}
                    className={
                      index < review.overallRating
                        ? "fill-primary text-primary size-4"
                        : "text-muted-foreground size-4"
                    }
                  />
                ))}
              </span>
            </div>
            {review.comment && <p className="text-sm">{review.comment}</p>}
            {reviewerQuestions.length > 0 && review.answers.length > 0 && (
              <AnswerList questions={reviewerQuestions} answers={review.answers} />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
