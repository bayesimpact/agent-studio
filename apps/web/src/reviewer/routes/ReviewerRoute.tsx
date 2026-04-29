import { useTranslation } from "react-i18next"
import { Outlet } from "react-router-dom"
import { HorizontalNavbar } from "@/common/components/sidebar/nav/HorizontalNavbar"
import { selectMe } from "@/common/features/me/me.selectors"
import { useInitStore } from "@/common/hooks/use-init-store"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { injectTesterSlices, resetTesterSlices } from "@/tester/store/slices"
import { injectReviewerSlices, resetReviewerSlices } from "../store/slices"
import { ReviewerRouteNames } from "./helpers"

export function ReviewerRoute() {
  const { t } = useTranslation()
  const { initDone } = useInitStore({
    inject: () => {
      injectTesterSlices()
      injectReviewerSlices()
    },
    reset(dispatch) {
      resetTesterSlices(dispatch)
      resetReviewerSlices(dispatch)
    },
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
            homePath={ReviewerRouteNames.HOME}
            appName={t("reviewerCampaigns:shell.title")}
          />
          <div className="mx-10 xl:mx-20 my-10 relative border rounded-2xl overflow-hidden">
            <Outlet />
          </div>
        </>
      )}
    </AsyncRoute>
  )
}
