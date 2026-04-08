import { Outlet } from "react-router-dom"
import { selectAbilities } from "@/common/features/auth/auth.selectors"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { useAppSelector } from "@/common/store/hooks"
import { useInitStore } from "../hooks/use-init-store"

export function Studio() {
  const abilities = useAppSelector(selectAbilities)
  useInitStore(abilities.canAccessStudio)
  if (!abilities.canAccessStudio) return <NotFoundRoute />
  return <Outlet />
}
