import { useEffect } from "react"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { MembersCreator } from "@/components/project-membership/MembersCreator"
import { ProjectMembershipList } from "@/components/project-membership/ProjectMembershipList"
import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { selectProjectMemberships } from "@/features/project-memberships/project-memberships.selectors"
import { listProjectMemberships } from "@/features/project-memberships/project-memberships.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ProjectMembershipsRoute() {
  const dispatch = useAppDispatch()
  const membershipsData = useAppSelector(selectProjectMemberships)

  useEffect(() => {
    dispatch(listProjectMemberships())
  }, [dispatch])

  if (ADS.isError(membershipsData)) return <NotFoundRoute />

  if (ADS.isFulfilled(membershipsData)) return <WithData memberships={membershipsData.value} />

  return <LoadingRoute />
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
