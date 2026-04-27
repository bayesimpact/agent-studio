import { Outlet } from "react-router-dom"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useInitStore } from "../hooks/use-init-store"

export function ReviewerShell() {
  const { initDone } = useInitStore(true)
  if (!initDone) return <LoadingRoute />
  return <Outlet />
}
