import { useTranslation } from "react-i18next"
import { Outlet, useNavigate } from "react-router-dom"
import { NavUser } from "@/common/components/sidebar/nav/NavUser"
import { NavUserMenuItems } from "@/common/components/sidebar/nav/NavUserMenuItems"
import { Logo } from "@/common/components/themes/Logo"
import type { User } from "@/common/features/me/me.models"
import { selectMe } from "@/common/features/me/me.selectors"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { useInitStore } from "../hooks/use-init-store"
import { TesterRouteNames } from "./helpers"

export function TesterShell() {
  const { initDone } = useInitStore(true)
  const me = useAppSelector(selectMe)
  if (!initDone) return <LoadingRoute />
  return (
    <AsyncRoute data={[me]}>
      {([user]) => (
        <>
          <Header user={user} />
          <Outlet />
        </>
      )}
    </AsyncRoute>
  )
}

function Header({ user }: { user: User }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const goHome = () => navigate(TesterRouteNames.HOME)
  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-4 gap-2">
      <button type="button" className="p-1 size-10 contain-content" onClick={goHome}>
        <Logo />
      </button>

      <button type="button" onClick={goHome} className="flex-1">
        <div className="flex flex-col gap-0 leading-none text-left">
          <span className="text-primary font-medium">{t("testerCampaigns:shell.title")}</span>
        </div>
      </button>

      <div>
        <NavUser user={user}>
          <NavUserMenuItems />
        </NavUser>
      </div>
    </div>
  )
}
