import { useCallback, useMemo } from "react"
import { useLocation } from "react-router-dom"
import type { RouteNames } from "@/routes/helpers"

export function useIsRoute() {
  const { pathname } = useLocation()
  const pathPieces = useMemo(() => {
    return getPathPieces(pathname)
  }, [pathname])

  const isRoute = useCallback(
    (routeName: RouteNames) => {
      const routePieces = getRoutePieces(routeName)

      return pathPieces.every((piece, index) => piece === routePieces[index])
    },
    [pathPieces],
  )

  return { isRoute }
}

function getPathPieces(pathname: string) {
  return (
    pathname
      .split("/")
      .filter(Boolean)
      // filter out id params and "app" and "admin" (for app routes)
      .filter((piece) => !idParamRegex.test(piece) && piece !== "app" && piece !== "admin")
  )
}
function getRoutePieces(routeName: RouteNames) {
  return routeName
    .split("/")
    .filter(Boolean)
    .filter((piece) => !piece.startsWith(":"))
}

// 6b40119c-5c06-47ce-b28b-138c22e48c92
const idParamRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
