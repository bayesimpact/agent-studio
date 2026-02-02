import type { Project } from "@/features/projects/projects.models"
import { selectProjectData } from "@/features/projects/projects.selectors"
import { useSetCurrentProjectId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ProjectHoc({ children }: { children: (project: Project) => React.ReactNode }) {
  useSetCurrentProjectId()
  const data = useAppSelector(selectProjectData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
