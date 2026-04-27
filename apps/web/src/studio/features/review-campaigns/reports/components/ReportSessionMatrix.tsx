import type { CampaignReportSessionRowDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { InboxIcon } from "lucide-react"

type Props = {
  rows: CampaignReportSessionRowDto[]
}

const shortenId = (id: string) => `${id.slice(0, 8)}…`
const formatDate = (millis: number) =>
  new Date(millis).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
const formatRating = (rating: number | null): string => (rating === null ? "—" : rating.toFixed(2))

export function ReportSessionMatrix({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No sessions yet</EmptyTitle>
          <EmptyDescription>
            The session matrix fills in as testers start sessions in this campaign.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Started</TableHead>
          <TableHead className="text-right">Tester</TableHead>
          <TableHead className="text-right">Reviewers</TableHead>
          <TableHead className="text-right">Mean reviewer</TableHead>
          <TableHead className="text-right">Spread</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.sessionId}>
            <TableCell className="flex flex-col gap-1">
              <span className="font-mono text-xs">{shortenId(row.sessionId)}</span>
              <Badge variant="outline" className="w-fit text-xs">
                {row.sessionType}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(row.startedAt)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRating(row.testerRating)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.reviewerCount === 0
                ? "—"
                : `${row.reviewerRatings.join(", ")} (${row.reviewerCount})`}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRating(row.meanReviewerRating)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.reviewerRatingSpread === null ? "—" : row.reviewerRatingSpread}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
