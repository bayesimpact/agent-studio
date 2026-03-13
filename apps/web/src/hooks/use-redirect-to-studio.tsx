import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { RouteNames } from "@/routes/helpers"
import { useAbility } from "./use-ability"
import { useGetPath } from "./use-build-path"

export function useRedirectToStudio({
  condition,
  to,
}: {
  condition: boolean
  to: "organization" | "project"
}) {
  const navigate = useNavigate()
  const { isAdmin, isAdminInterface } = useAbility()
  const { getPath } = useGetPath()
  useEffect(() => {
    if (isAdmin && !isAdminInterface && condition) {
      const path = getPath(to, { forceInterface: RouteNames.STUDIO })
      navigate(path, { replace: true })
    }
  }, [isAdmin, isAdminInterface, condition, navigate, getPath, to])
}
