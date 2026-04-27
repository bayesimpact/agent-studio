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

type Props = {
  aggregates: CampaignAggregatesDto | null
  onOpenReport?: () => void
}

const formatRating = (rating: number | null): string => (rating === null ? "—" : rating.toFixed(2))

export function CampaignSummaryPanel({ aggregates, onOpenReport }: Props) {
  if (!aggregates) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Aggregated results become available once the campaign is closed.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {onOpenReport && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onOpenReport}>
            <BarChartIcon /> View full report
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <StarIcon className="size-4" /> Mean tester rating
            </CardDescription>
            <CardTitle className="text-3xl">{formatRating(aggregates.meanTesterRating)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Average of the per-session overall ratings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <MessageSquareIcon className="size-4" /> Sessions
            </CardDescription>
            <CardTitle className="text-3xl">{aggregates.sessionCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Total sessions started by testers.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <ClipboardListIcon className="size-4" /> End-of-phase surveys
            </CardDescription>
            <CardTitle className="text-3xl">{aggregates.surveyCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Testers who submitted the final survey.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
