import { Outlet } from "react-router-dom"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { selectAbilities } from "@/features/auth/auth.selectors"
import { useAppSelector } from "@/store/hooks"
import { useInitStore } from "../hooks/use-init-store"

export function Studio() {
  const abilities = useAppSelector(selectAbilities)
  useInitStore(abilities.canAccessStudio)
  if (!abilities.canAccessStudio) return <NotFoundRoute />
  return <Outlet />
}
