import { Outlet } from "react-router-dom"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useInitStore } from "../hooks/use-init-store"

export function TesterShell() {
  const { initDone } = useInitStore(true)
  if (!initDone) return <LoadingRoute />
  return <Outlet />
}
