import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { EmptyProjectMembership } from "./EmptyProjectMembership"
import { ProjectMembershipItem } from "./ProjectMembershipItem"

export function ProjectMembershipList({ memberships }: { memberships: ProjectMembership[] }) {
  if (memberships.length === 0) return <EmptyProjectMembership />
  return (
    // FIXME: use a Table instead of a list
    <div className="flex flex-col gap-4">
      {memberships.map((membership) => (
        <ProjectMembershipItem key={membership.id} membership={membership} />
      ))}
    </div>
  )
}
