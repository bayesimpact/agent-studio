import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Trash2Icon, UserIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { removeProjectMembership } from "@/features/project-memberships/project-memberships.thunks"
import { useAppDispatch } from "@/store/hooks"

export function ProjectMembershipItem({ membership }: { membership: ProjectMembership }) {
  const dispatch = useAppDispatch()

  const handleRemove = () => {
    dispatch(removeProjectMembership({ membershipId: membership.id }))
  }

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemHeader>
          <ItemTitle>
            <Avatar />
            <span className="capitalize">{membership.userName}</span>
            <span className="text-muted-foreground">{membership.userEmail}</span>
            <Badge variant="outline" className="capitalize">
              {membership.role}
            </Badge>
          </ItemTitle>
          <ItemActions>
            <StatusBadge status={membership.status} />
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <Trash2Icon className="size-4" />
            </Button>
          </ItemActions>
        </ItemHeader>
      </ItemContent>
    </Item>
  )
}

function Avatar() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
      <UserIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  )
}

function StatusBadge({ status }: { status: ProjectMembership["status"] }) {
  const { t } = useTranslation("projectMembership")
  const isAccepted = status === "accepted"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAccepted
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {t(`statuses.${status}`)}
    </span>
  )
}
