import type { CampaignReportDto } from "@caseai-connect/api-contracts"
import { QuestionDistributionChart } from "./QuestionDistributionChart"
import { ReportHeadlineCards } from "./ReportHeadlineCards"
import { ReportSessionMatrix } from "./ReportSessionMatrix"

type Props = {
  report: CampaignReportDto
}

export function CampaignReport({ report }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ReportHeadlineCards headline={report.headline} />

      <DistributionSection
        title="Tester — per-session questions"
        description="One response per tester session."
        distributions={report.testerPerSessionDistributions}
      />
      <DistributionSection
        title="Tester — end-of-phase questions"
        description="One response per tester who completed the final survey."
        distributions={report.testerEndOfPhaseDistributions}
      />
      <DistributionSection
        title="Reviewer questions"
        description="One response per reviewer review across all sessions."
        distributions={report.reviewerDistributions}
      />

      <section className="flex flex-col gap-3">
        <header>
          <h3 className="text-lg font-semibold">Session matrix</h3>
          <p className="text-muted-foreground text-sm">
            Per-session tester vs. reviewer ratings. Spread is the difference between the lowest and
            highest reviewer rating — high spread suggests reviewer disagreement.
          </p>
        </header>
        <ReportSessionMatrix rows={report.sessionMatrix} />
      </section>
    </div>
  )
}

function DistributionSection({
  title,
  description,
  distributions,
}: {
  title: string
  description: string
  distributions: CampaignReportDto["testerPerSessionDistributions"]
}) {
  if (distributions.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>
      <div className="flex flex-col gap-4">
        {distributions.map((distribution) => (
          <QuestionDistributionChart key={distribution.questionId} distribution={distribution} />
        ))}
      </div>
    </section>
  )
}
