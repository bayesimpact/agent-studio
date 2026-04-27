import type { CampaignReportHeadlineDto } from "@caseai-connect/api-contracts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { ClipboardListIcon, MessageSquareIcon, StarIcon, UsersIcon } from "lucide-react"

type Props = {
  headline: CampaignReportHeadlineDto
}

const formatRating = (rating: number | null): string => (rating === null ? "—" : rating.toFixed(2))

export function ReportHeadlineCards({ headline }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HeadlineCard
        icon={<MessageSquareIcon className="size-4" />}
        label="Sessions"
        value={headline.sessionCount}
        hint={`${headline.participantCount} unique testers`}
      />
      <HeadlineCard
        icon={<StarIcon className="size-4" />}
        label="Mean tester rating"
        value={formatRating(headline.meanTesterRating)}
        hint={`${headline.testerFeedbackCount} per-session responses`}
      />
      <HeadlineCard
        icon={<UsersIcon className="size-4" />}
        label="Mean reviewer rating"
        value={formatRating(headline.meanReviewerRating)}
        hint={`${headline.reviewerReviewCount} reviewer reviews`}
      />
      <HeadlineCard
        icon={<ClipboardListIcon className="size-4" />}
        label="Mean end-of-phase"
        value={formatRating(headline.meanEndOfPhaseRating)}
        hint="From final tester surveys"
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
