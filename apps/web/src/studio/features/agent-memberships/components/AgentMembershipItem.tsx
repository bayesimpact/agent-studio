import { Button } from "@caseai-connect/ui/shad/button"
import { CheckIcon, SendIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { selectMe } from "@/common/features/me/me.selectors"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import { GridItem } from "@/studio/components/grid/Grid"
import type { AgentMembership } from "@/studio/features/agent-memberships/agent-memberships.models"
import { removeAgentMembership } from "@/studio/features/agent-memberships/agent-memberships.thunks"

export function AgentMembershipItem({
  membership,
  index,
}: {
  membership: AgentMembership
  index: number
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const me = useAppSelector(selectMe)
  const handleRemove = () => {
    dispatch(removeAgentMembership({ membershipId: membership.id }))
  }

  const disabled = membership.role === "owner" || membership.userId === me?.value?.id

  const date = buildSince(membership.createdAt)
  return (
    <GridItem
      index={index}
      title={membership.userName}
      description={membership.userEmail}
      badge={membership.role}
      action={
        <div className="flex items-center gap-4 flex-wrap">
          {membership.status === "accepted" ? (
            <Button variant="secondary" size="sm" onClick={handleRemove} disabled={true}>
              <CheckIcon className="size-4 text-green-500" />{" "}
              {t("projectMembership:statuses.accepted")}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleRemove} disabled={true}>
              <SendIcon className="size-4" />{" "}
              <span>
                {t("projectMembership:statuses.sent")} {date}
              </span>
            </Button>
          )}
          {!disabled && (
            <Button variant="outline" size="sm" onClick={handleRemove}>
              <Trash2Icon className="size-4" /> {t("actions:delete")}
            </Button>
          )}
        </div>
      }
    />
  )
}
