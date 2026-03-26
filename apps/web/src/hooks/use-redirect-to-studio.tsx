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
  const { abilities, isAdminInterface } = useAbility()
  const { getPath } = useGetPath()
  useEffect(() => {
    if (abilities.canManageProjects && !isAdminInterface && condition) {
      const path = getPath(to, { forceInterface: RouteNames.STUDIO })
      navigate(path, { replace: true })
    }
  }, [abilities, isAdminInterface, condition, navigate, getPath, to])
}
