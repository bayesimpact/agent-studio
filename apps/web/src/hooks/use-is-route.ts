import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import type { RouteNames } from "@/routes/helpers"

export function useIsRoute(routeName: RouteNames): boolean {
  const routePieces = useMemo(() => {
    return routeName
      .split("/")
      .filter(Boolean)
      .filter((piece) => !piece.startsWith(":"))
  }, [routeName])

  const { pathname } = useLocation()
  const pathPieces = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .filter((piece) => !idParamRegex.test(piece) && piece !== "app" && piece !== "admin") // filter out id params and "app" and "admin" (for app routes)
  }, [pathname])

  return useMemo(
    () => pathPieces.every((piece, index) => piece === routePieces[index]),
    [routePieces, pathPieces],
  )
}

// 6b40119c-5c06-47ce-b28b-138c22e48c92
const idParamRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
