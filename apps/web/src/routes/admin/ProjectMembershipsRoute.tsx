import { useEffect } from "react"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { MembersCreator } from "@/components/project-membership/MembersCreator"
import { ProjectMembershipList } from "@/components/project-membership/ProjectMembershipList"
import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { selectProjectMemberships } from "@/features/project-memberships/project-memberships.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

export function ProjectMembershipsRoute() {
  const memberships = useAppSelector(selectProjectMemberships)

  return (
    <AsyncRoute data={[memberships]}>
      {([membershipsValue]) => <WithData memberships={membershipsValue} />}
    </AsyncRoute>
  )
}

function WithData({ memberships }: { memberships: ProjectMembership[] }) {
  useHandleHeader()
  return (
    <div className="p-6">
      <ProjectMembershipList memberships={memberships} />
    </div>
  )
}

function useHandleHeader() {
  const { setHeaderRightSlot } = useSidebarLayout()
  useEffect(() => {
    setHeaderRightSlot(<MembersCreator />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot])
}
