import { createListenerMiddleware } from "@reduxjs/toolkit"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { selectCurrentReviewCampaignId } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { reviewCampaignsReportsActions } from "./reports.slice"
import { getCampaignReport } from "./reports.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Tier-1 (always-on) middleware. The report page is rendered from both the
// studio scope (`ReviewCampaignReportRoute`) and the reviewer scope
// (`ReviewerReportRoute`), so the loader needs to fire regardless of which
// scope is active. Registered in `apps/web/src/common/store/index.ts`.
listenerMiddleware.startListening({
  actionCreator: reviewCampaignsReportsActions.mount,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const organizationId = selectCurrentOrganizationId(state)
    const projectId = selectCurrentProjectId(state)
    const reviewCampaignId = selectCurrentReviewCampaignId(state)
    if (!organizationId || !projectId || !reviewCampaignId) return
    listenerApi.dispatch(getCampaignReport({ organizationId, projectId, reviewCampaignId }))
  },
})

export { listenerMiddleware as reviewCampaignsReportsMiddleware }
