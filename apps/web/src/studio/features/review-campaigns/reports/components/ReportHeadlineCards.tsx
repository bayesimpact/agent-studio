import type { CampaignReportHeadlineDto } from "@caseai-connect/api-contracts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { ClipboardListIcon, MessageSquareIcon, StarIcon, UsersIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  headline: CampaignReportHeadlineDto
}

const formatRating = (rating: number | null): string => (rating === null ? "—" : rating.toFixed(2))

export function ReportHeadlineCards({ headline }: Props) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HeadlineCard
        icon={<MessageSquareIcon className="size-4" />}
        label={t("reviewCampaigns:report.headline.sessions")}
        value={headline.sessionCount}
        hint={t("reviewCampaigns:report.headline.sessionsHint", {
          count: headline.participantCount,
        })}
      />
      <HeadlineCard
        icon={<StarIcon className="size-4" />}
        label={t("reviewCampaigns:report.headline.meanTesterRating")}
        value={formatRating(headline.meanTesterRating)}
        hint={t("reviewCampaigns:report.headline.meanTesterRatingHint", {
          count: headline.testerFeedbackCount,
        })}
      />
      <HeadlineCard
        icon={<UsersIcon className="size-4" />}
        label={t("reviewCampaigns:report.headline.meanReviewerRating")}
        value={formatRating(headline.meanReviewerRating)}
        hint={t("reviewCampaigns:report.headline.meanReviewerRatingHint", {
          count: headline.reviewerReviewCount,
        })}
      />
      <HeadlineCard
        icon={<ClipboardListIcon className="size-4" />}
        label={t("reviewCampaigns:report.headline.meanEndOfPhase")}
        value={formatRating(headline.meanEndOfPhaseRating)}
        hint={t("reviewCampaigns:report.headline.meanEndOfPhaseHint")}
      />
    </div>
  )
}

function HeadlineCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  hint: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {icon} {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  )
}
