import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { projectsActions } from "@/common/features/projects/projects.slice"
import { useMount } from "@/common/hooks/use-mount"
import { useAppSelector } from "@/common/store/hooks"
import { ProjectAdminPage } from "../features/project-admin/components/ProjectAdminPage"

export function ProjectAdminRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)

  useMount({
    actions: { mount: projectsActions.adminMount, unmount: projectsActions.adminUnmount },
    condition: !!projectId,
  })

  return <ProjectAdminPage />
}
