import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { selectAbilities } from "@/features/auth/auth.selectors"
import { authActions } from "@/features/auth/auth.slice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RouteNames } from "../routes/helpers"

export const useSetIsAdminInterface = () => {
  const dispatch = useAppDispatch()
  const abilities = useAppSelector(selectAbilities)
  const { pathname } = useLocation()

  useEffect(() => {
    const areWeOnStudioPage = pathname.startsWith(`${RouteNames.STUDIO}/`)
    dispatch(authActions.setIsAdminInterface(areWeOnStudioPage && abilities.canManageProjects))
  }, [dispatch, pathname, abilities])
}
