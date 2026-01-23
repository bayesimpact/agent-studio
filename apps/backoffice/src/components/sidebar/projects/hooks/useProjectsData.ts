import { useEffect } from "react"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import { listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function useProjectsData() {
  const dispatch = useAppDispatch()
  const organizations = useAppSelector(selectOrganizations)
  const projects = useAppSelector(selectProjects)

  // Get the first organization (current organization)
  const currentOrganization = organizations.length > 0 ? organizations[0] : null

  // Load projects when organization is available or changes
  useEffect(() => {
    if (currentOrganization) {
      dispatch(listProjects(currentOrganization.id))
    }
  }, [currentOrganization?.id, dispatch, currentOrganization])

  const projectList = projects?.projects || []

  return {
    currentOrganization,
    projectList,
  }
}
