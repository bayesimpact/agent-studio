import type { Project } from "@/features/projects/projects.models"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ProjectsHoc({ children }: { children: (projects: Project[]) => React.ReactNode }) {
  const data = useAppSelector(selectProjectsData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
