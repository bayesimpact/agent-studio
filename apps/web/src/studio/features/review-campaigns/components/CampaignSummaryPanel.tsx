import type { CampaignAggregatesDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { BarChartIcon, ClipboardListIcon, MessageSquareIcon, StarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  aggregates: CampaignAggregatesDto | null
  onOpenReport?: () => void
}

const formatRating = (rating: number | null): string => (rating === null ? "—" : rating.toFixed(2))

export function CampaignSummaryPanel({ aggregates, onOpenReport }: Props) {
  const { t } = useTranslation()

  if (!aggregates) {
    return (
      <p className="text-muted-foreground text-sm italic">{t("reviewCampaigns:summary.pending")}</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {onOpenReport && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onOpenReport}>
            <BarChartIcon /> {t("reviewCampaigns:summary.viewFullReport")}
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <StarIcon className="size-4" /> {t("reviewCampaigns:summary.meanTesterRating")}
            </CardDescription>
            <CardTitle className="text-3xl">{formatRating(aggregates.meanTesterRating)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {t("reviewCampaigns:summary.meanTesterRatingHint")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <MessageSquareIcon className="size-4" /> {t("reviewCampaigns:summary.sessions")}
            </CardDescription>
            <CardTitle className="text-3xl">{aggregates.sessionCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {t("reviewCampaigns:summary.sessionsHint")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <ClipboardListIcon className="size-4" />{" "}
              {t("reviewCampaigns:summary.endOfPhaseSurveys")}
            </CardDescription>
            <CardTitle className="text-3xl">{aggregates.surveyCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {t("reviewCampaigns:summary.endOfPhaseSurveysHint")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
