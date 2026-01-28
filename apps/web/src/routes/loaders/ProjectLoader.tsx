import {
  selectCurrentProjectId,
  selectProjectsStatus,
} from "@/features/projects/projects.selectors"
import { useSetCurrentProjectId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ProjectLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentProjectId()

  const projectId = useAppSelector(selectCurrentProjectId)
  const status = useAppSelector(selectProjectsStatus)

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status) && projectId) return <>{children}</>

  return <LoadingRoute />
}
