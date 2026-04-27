import type { CampaignReportQuestionDistributionDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"

type Props = {
  distribution: CampaignReportQuestionDistributionDto
}

const QUESTION_TYPE_LABEL: Record<CampaignReportQuestionDistributionDto["type"], string> = {
  rating: "Rating",
  "single-choice": "Single choice",
  "free-text": "Free text",
}

/**
 * Renders a per-question distribution as a horizontal bar chart (no external
 * chart lib — we draw percentage-width div bars so it plays nicely with
 * Storybook / printing). Free-text questions only show the response count.
 */
export function QuestionDistributionChart({ distribution }: Props) {
  const total = distribution.buckets.reduce((accumulator, bucket) => accumulator + bucket.count, 0)

  return (
    <section className="flex flex-col gap-3 rounded-md border p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold">{distribution.prompt}</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{QUESTION_TYPE_LABEL[distribution.type]}</Badge>
            <span className="text-muted-foreground text-xs">
              {distribution.responseCount}{" "}
              {distribution.responseCount === 1 ? "response" : "responses"}
            </span>
          </div>
        </div>
      </header>

      {distribution.type === "free-text" ? (
        <p className="text-muted-foreground text-sm italic">
          Free-text answers aren't summarized here — review individual sessions to read them.
        </p>
      ) : distribution.buckets.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">No responses yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {distribution.buckets.map((bucket) => {
            const percent = total === 0 ? 0 : (bucket.count / total) * 100
            return (
              <li key={bucket.label} className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 shrink-0 text-right text-xs">
                  {bucket.label}
                </span>
                <div
                  className="bg-muted relative h-5 flex-1 overflow-hidden rounded"
                  role="img"
                  aria-label={`${bucket.count} responses (${percent.toFixed(0)}%)`}
                >
                  <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums">
                  {bucket.count}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
