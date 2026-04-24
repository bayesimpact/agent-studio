import type { ReviewerSessionListItemDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
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
import { CheckCircle2Icon, CircleIcon, InboxIcon } from "lucide-react"

type Props = {
  sessions: ReviewerSessionListItemDto[]
  onOpen: (sessionId: string) => void
}

const shortenId = (id: string) => `${id.slice(0, 8)}…`
const formatDate = (millis: number) =>
  new Date(millis).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export function ReviewerSessionsTable({ sessions, onOpen }: Props) {
  if (sessions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No sessions yet</EmptyTitle>
          <EmptyDescription>
            Testers haven't submitted any sessions on this campaign yet.
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
          <TableHead className="text-right">Messages</TableHead>
          <TableHead className="text-right">Reviewers</TableHead>
          <TableHead>My review</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.sessionId}>
            <TableCell className="flex flex-col gap-1">
              <span className="font-mono text-xs">{shortenId(session.sessionId)}</span>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {session.sessionType}
                </Badge>
                {session.callerIsSessionOwner && (
                  <Badge variant="secondary" className="text-xs">
                    your session
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{formatDate(session.startedAt)}</TableCell>
            <TableCell className="text-right">{session.messageCount}</TableCell>
            <TableCell className="text-right">{session.reviewerCount}</TableCell>
            <TableCell>
              {session.callerHasReviewed ? (
                <span className="flex items-center gap-1 text-sm">
                  <CheckCircle2Icon className="size-4 text-green-600" /> Submitted
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <CircleIcon className="size-4" /> Pending
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={session.callerIsSessionOwner ? "ghost" : "outline"}
                disabled={session.callerIsSessionOwner}
                onClick={() => onOpen(session.sessionId)}
              >
                {session.callerHasReviewed ? "View" : "Review"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
