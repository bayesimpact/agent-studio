import { useEffect } from "react"
import { selectProjectsStatus } from "@/features/projects/projects.selectors"
import { listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectsLoader({
  children,
  organizationId,
}: {
  children: React.ReactNode
  organizationId: string
}) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)

  useEffect(() => {
    dispatch(listProjects({ organizationId }))
  }, [dispatch, organizationId])

  if (status === "failed") return <NotFoundRoute />

  if (status === "succeeded") return <>{children}</>

  return <LoadingRoute />
}
