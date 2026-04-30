import { Outlet } from "react-router-dom"
import { selectCurrentReviewerSessionId } from "@/common/features/review-campaigns/current-reviewer-session-id/current-reviewer-session-id.selectors"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { selectReviewerSessionDetail } from "../features/review-campaigns/reviewer.selectors"
import { reviewCampaignsReviewerActions } from "../features/review-campaigns/reviewer.slice"

export function ReviewerSessionRoute() {
  const sessionId = useAppSelector(selectCurrentReviewerSessionId)
  const detailState = useAppSelector(selectReviewerSessionDetail(sessionId ?? ""))

  useMount({
    actions: {
      mount: reviewCampaignsReviewerActions.sessionMount,
      unmount: reviewCampaignsReviewerActions.sessionUnmount,
    },
    condition: !!sessionId,
  })

  if (!sessionId) return <LoadingRoute />
  return <AsyncRoute data={[detailState]}>{() => <Outlet />}</AsyncRoute>
}
