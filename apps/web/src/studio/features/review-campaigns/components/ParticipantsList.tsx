import type {
  ReviewCampaignMembershipDto,
  ReviewCampaignMembershipRole,
} from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldLabel } from "@caseai-connect/ui/shad/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { useState } from "react"

type Props = {
  memberships: ReviewCampaignMembershipDto[]
  onInvite: (role: ReviewCampaignMembershipRole, emails: string[]) => void
  onRevoke: (membershipId: string) => void
  disabled?: boolean
}

const ROLE_LABELS: Record<ReviewCampaignMembershipRole, string> = {
  tester: "Tester",
  reviewer: "Reviewer",
}

const formatDate = (millis: number): string =>
  new Date(millis).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

const parseEmails = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)

export function ParticipantsList({ memberships, onInvite, onRevoke, disabled = false }: Props) {
  const [emailsInput, setEmailsInput] = useState("")
  const [role, setRole] = useState<ReviewCampaignMembershipRole>("tester")

  const handleInvite = () => {
    const emails = parseEmails(emailsInput)
    if (emails.length === 0) return
    onInvite(role, emails)
    setEmailsInput("")
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border p-3">
        <h3 className="text-sm font-semibold">Invite participants</h3>
        <div className="flex flex-col gap-3 md:flex-row">
          <Field className="md:flex-1">
            <FieldLabel htmlFor="invite-emails">Emails (comma or newline separated)</FieldLabel>
            <Textarea
              id="invite-emails"
              rows={3}
              value={emailsInput}
              disabled={disabled}
              placeholder="alice@example.com, bob@example.com"
              onChange={(event) => setEmailsInput(event.target.value)}
            />
          </Field>
          <Field className="md:w-40">
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <Select
              value={role}
              disabled={disabled}
              onValueChange={(value) => setRole(value as ReviewCampaignMembershipRole)}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tester">Tester</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleInvite}
            disabled={disabled || parseEmails(emailsInput).length === 0}
          >
            Send invitations
          </Button>
        </div>
      </div>

      {memberships.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">No participants invited yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Accepted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell className="font-medium">{membership.userEmail}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABELS[membership.role]}</Badge>
                </TableCell>
                <TableCell>{formatDate(membership.invitedAt)}</TableCell>
                <TableCell>
                  {membership.acceptedAt ? (
                    formatDate(membership.acceptedAt)
                  ) : (
                    <span className="text-muted-foreground text-sm italic">pending</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onRevoke(membership.id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
