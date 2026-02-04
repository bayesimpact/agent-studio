import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import type { User } from "@/features/me/me.models"
import { selectMeData } from "@/features/me/me.selectors"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { setCurrentIds } from "./loaders/set-current-ids"
import { NotFoundRoute } from "./NotFoundRoute"

export function DashboardRoute() {
  const user = useAppSelector(selectMeData)
  const organizations = useAppSelector(selectOrganizationsData)
  const projects = useAppSelector(selectProjectsData)

  if (ADS.isError(user) || ADS.isError(organizations) || ADS.isError(projects))
    return <NotFoundRoute />

  if (ADS.isFulfilled(user) && ADS.isFulfilled(organizations) && ADS.isFulfilled(projects)) {
    return (
      <WithData user={user.value} projects={projects.value} organizations={organizations.value} />
    )
  }

  return <LoadingRoute />
}

function WithData({
  user,
  projects,
  organizations,
}: {
  user: User
  projects: Project[]
  organizations: Organization[]
}) {
  const dispatch = useAppDispatch()
  const params = useParams()
  setCurrentIds({ dispatch, params })

  const organization = organizations[0]
  if (!organization) return <NotFoundRoute />
  return <DashboardLayout user={user} projects={projects} organization={organization} />
}
