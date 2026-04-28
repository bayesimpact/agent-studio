import type { CampaignReportDto } from "@caseai-connect/api-contracts"
import { useTranslation } from "react-i18next"
import { QuestionDistributionChart } from "./QuestionDistributionChart"
import { ReportHeadlineCards } from "./ReportHeadlineCards"
import { ReportSessionMatrix } from "./ReportSessionMatrix"

type Props = {
  report: CampaignReportDto
}

export function CampaignReport({ report }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-8">
      <ReportHeadlineCards headline={report.headline} />

      <DistributionSection
        title={t("reviewCampaigns:report.testerPerSession.title")}
        description={t("reviewCampaigns:report.testerPerSession.description")}
        distributions={report.testerPerSessionDistributions}
      />
      <DistributionSection
        title={t("reviewCampaigns:report.testerEndOfPhase.title")}
        description={t("reviewCampaigns:report.testerEndOfPhase.description")}
        distributions={report.testerEndOfPhaseDistributions}
      />
      <DistributionSection
        title={t("reviewCampaigns:report.reviewer.title")}
        description={t("reviewCampaigns:report.reviewer.description")}
        distributions={report.reviewerDistributions}
      />

      <section className="flex flex-col gap-3">
        <header>
          <h3 className="text-lg font-semibold">
            {t("reviewCampaigns:report.sessionMatrix.title")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("reviewCampaigns:report.sessionMatrix.description")}
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
