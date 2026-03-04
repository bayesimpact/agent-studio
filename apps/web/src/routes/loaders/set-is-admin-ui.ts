import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { selectIsAdmin } from "@/features/auth/auth.selectors"
import { authActions } from "@/features/auth/auth.slice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export const useSetIsAdminUi = () => {
  const dispatch = useAppDispatch()
  const isAdmin = useAppSelector(selectIsAdmin)
  const { pathname } = useLocation()

  useEffect(() => {
    const areWeOnAdminPage = pathname.startsWith("/admin/")
    dispatch(authActions.setIsAdminInterface(areWeOnAdminPage && isAdmin))
  }, [dispatch, pathname, isAdmin])
}
