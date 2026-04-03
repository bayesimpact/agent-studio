import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { selectAbilities } from "@/features/auth/auth.selectors"
import { authActions } from "@/features/auth/auth.slice"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { injectStudioSlices } from "../store/slices"

export function Studio() {
  injectStudioSlices()

  const dispatch = useAppDispatch()
  const abilities = useAppSelector(selectAbilities)

  useEffect(() => {
    dispatch(authActions.setIsStudioInterface(true))
    return () => {
      dispatch(authActions.setIsStudioInterface(false))
    }
  }, [dispatch])

  const canAccessStudio = abilities.canManageOrganizations || abilities.canManageProjects
  if (!canAccessStudio) return <NotFoundRoute />
  return <Outlet />
}
