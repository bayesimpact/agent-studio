import { Outlet } from "react-router-dom"
import { selectCurrentReviewCampaignId } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { selectTesterContext } from "../features/review-campaigns/tester.selectors"
import { reviewCampaignsTesterActions } from "../features/review-campaigns/tester.slice"

export function TesterCampaignRoute() {
  const reviewCampaignId = useAppSelector(selectCurrentReviewCampaignId)
  const testerContext = useAppSelector(selectTesterContext)

  useMount({ actions: reviewCampaignsTesterActions, condition: !!reviewCampaignId })

  if (!reviewCampaignId) return <LoadingRoute />
  return <AsyncRoute data={[testerContext]}>{() => <Outlet />}</AsyncRoute>
}
