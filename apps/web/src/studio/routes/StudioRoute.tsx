import { Outlet } from "react-router-dom"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { useAppSelector } from "@/common/store/hooks"
import { useInitStore } from "../hooks/use-init-store"

export function Studio() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const { abilities } = useAbility()
  const canAccessStudio = abilities.canAccessStudio(organizationId)
  useInitStore(canAccessStudio)
  if (!canAccessStudio) return <NotFoundRoute redirectToHome />
  return <Outlet />
}
