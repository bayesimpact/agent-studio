import { useTranslation } from "react-i18next"
import { Outlet } from "react-router-dom"
import { HorizontalNavbar } from "@/common/components/sidebar/nav/HorizontalNavbar"
import { selectMe } from "@/common/features/me/me.selectors"
import { useInitStore } from "@/common/hooks/use-init-store"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { injectTesterSlices, resetTesterSlices } from "../store/slices"
import { TesterRouteNames } from "./helpers"

export function TesterRoute() {
  const { t } = useTranslation()
  const { initDone } = useInitStore({
    inject: injectTesterSlices,
    reset: resetTesterSlices,
    condition: true,
  })
  const me = useAppSelector(selectMe)
  if (!initDone) return <LoadingRoute />
  return (
    <AsyncRoute data={[me]}>
      {([user]) => (
        <>
          <HorizontalNavbar
            user={user}
            homePath={TesterRouteNames.HOME}
            appName={t("testerCampaigns:shell.title")}
          />
          <Outlet />
        </>
      )}
    </AsyncRoute>
  )
}
