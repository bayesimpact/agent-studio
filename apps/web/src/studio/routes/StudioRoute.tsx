import { Outlet } from "react-router-dom"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { useAppSelector } from "@/common/store/hooks"
import { useInitStore } from "../hooks/use-init-store"

export function Studio() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const { abilities } = useAbility()
  const canAccessStudio = abilities.canAccessStudio({ projectId })
  useInitStore(canAccessStudio)
  if (!canAccessStudio) return <NotFoundRoute redirectToHome />
  return <Outlet />
}
