import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { selectIsAdmin } from "@/features/auth/auth.selectors"
import { authActions } from "@/features/auth/auth.slice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RouteNames } from "../helpers"

export const useSetIsAdminInterface = () => {
  const dispatch = useAppDispatch()
  const isAdmin = useAppSelector(selectIsAdmin)
  const { pathname } = useLocation()

  useEffect(() => {
    const areWeOnStudioPage = pathname.startsWith(`${RouteNames.STUDIO}/`)
    dispatch(authActions.setIsAdminInterface(areWeOnStudioPage && isAdmin))
  }, [dispatch, pathname, isAdmin])
}
