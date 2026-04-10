import { useOutlet } from "react-router-dom"
import type { User } from "@/common/features/me/me.models"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { ProjectList } from "@/common/features/projects/components/ProjectList"
import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"

export function EvalDashboardRoute({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const outlet = useOutlet()
  const _project = useAppSelector(selectCurrentProjectData)
  // FIXME:

  return (
    <div className="w-4/5 lg:w-3/4 mx-auto my-10 border relative rounded-2xl overflow-hidden">
      {outlet ? outlet : <ProjectList projects={projects} organization={organization} />}
    </div>
  )
}
