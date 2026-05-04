import { Outlet } from "react-router-dom"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { useInitStore } from "@/common/hooks/use-init-store"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { useAppSelector } from "@/common/store/hooks"
import { injectStudioSlices, resetStudioSlices } from "../store/slices"

export function StudioRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const { abilities } = useAbility()
  const canAccessStudio = abilities.canAccessStudio({ projectId })
  const { initDone } = useInitStore({
    inject: injectStudioSlices,
    reset: resetStudioSlices,
    condition: canAccessStudio,
  })

  if (canAccessStudio) {
    if (initDone) return <Outlet />
    return <LoadingRoute />
  }
  return <NotFoundRoute redirectToHome />
}
