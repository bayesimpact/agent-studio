import { Button } from "@caseai-connect/ui/shad/button"
import { Card, CardContent } from "@caseai-connect/ui/shad/card"
import { TrashIcon, UserIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { removeProjectMembership } from "@/features/project-memberships/project-memberships.thunks"
import { useAppDispatch } from "@/store/hooks"

export function ProjectMembershipsList({
  memberships,
  organizationId,
  projectId,
}: {
  memberships: ProjectMembership[]
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("projectMemberships")

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <UserIcon className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">{t("empty.title")}</p>
        <p className="text-sm">{t("empty.description")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {memberships.map((membership) => (
        <ProjectMembershipItem
          key={membership.id}
          membership={membership}
          organizationId={organizationId}
          projectId={projectId}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: ProjectMembership["status"] }) {
  const { t } = useTranslation("projectMemberships")
  const isAccepted = status === "accepted"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAccepted
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {t(`status.${status}`)}
    </span>
  )
}

function ProjectMembershipItem({
  membership,
  organizationId,
  projectId,
}: {
  membership: ProjectMembership
  organizationId: string
  projectId: string
}) {
  const dispatch = useAppDispatch()

  const handleRemove = () => {
    dispatch(
      removeProjectMembership({
        organizationId,
        projectId,
        membershipId: membership.id,
      }),
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{membership.userName || membership.userEmail}</p>
            {membership.userName && (
              <p className="text-sm text-muted-foreground">{membership.userEmail}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={membership.status} />
          <Button variant="ghost" size="icon" onClick={handleRemove}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
