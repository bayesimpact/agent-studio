import { useCallback, useMemo } from "react"
import { useLocation } from "react-router-dom"
import type { RouteNames } from "@/common/routes/helpers"
import { DeskRouteNames } from "@/desk/routes/helpers"
import { StudioRouteNames } from "@/studio/routes/helpers"

export function useIsRoute() {
  const { pathname } = useLocation()
  const pathPieces = useMemo(() => {
    return getPathPieces(pathname)
  }, [pathname])

  const isRoute = useCallback(
    (routeName: RouteNames | StudioRouteNames | DeskRouteNames) => {
      const routePieces = getRoutePieces(routeName)
      return pathPieces === routePieces
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
      // filter out id params and "app" and "studio" (for app routes)
      .filter(
        (piece) =>
          !idParamRegex.test(piece) &&
          piece !== DeskRouteNames.APP.slice(1) &&
          piece !== StudioRouteNames.APP.slice(1),
      )
      .toString()
  )
}
function getRoutePieces(routeName: RouteNames | StudioRouteNames | DeskRouteNames) {
  return routeName
    .split("/")
    .filter(Boolean)
    .filter((piece) => !piece.startsWith(":"))
    .toString()
}

// 6b40119c-5c06-47ce-b28b-138c22e48c92
const idParamRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
