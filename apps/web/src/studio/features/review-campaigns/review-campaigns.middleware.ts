import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { hasOrganizationChanged } from "@/common/features/organizations/organizations.selectors"
import { hasProjectChanged } from "@/common/features/projects/projects.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import {
  createReviewCampaign,
  deleteReviewCampaign,
  inviteReviewCampaignMembers,
  listReviewCampaigns,
  revokeReviewCampaignMembership,
  updateReviewCampaign,
} from "./review-campaigns.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  // Refresh list when project or organization changes
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return (
        hasProjectChanged(originalState, currentState) ||
        hasOrganizationChanged(originalState, currentState)
      )
    },
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listReviewCampaigns())
    },
  })

  // Refresh list after mutating actions
  listenerMiddleware.startListening({
    matcher: isAnyOf(
      createReviewCampaign.fulfilled,
      updateReviewCampaign.fulfilled,
      deleteReviewCampaign.fulfilled,
      inviteReviewCampaignMembers.fulfilled,
      revokeReviewCampaignMembership.fulfilled,
    ),
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listReviewCampaigns())
    },
  })

  // Notifications — success / error for each action
  const notifications: Array<{
    action:
      | typeof createReviewCampaign
      | typeof updateReviewCampaign
      | typeof deleteReviewCampaign
      | typeof inviteReviewCampaignMembers
      | typeof revokeReviewCampaignMembership
    success: string
    error: string
  }> = [
    {
      action: createReviewCampaign,
      success: "Review campaign created successfully",
      error: "Review campaign creation failed",
    },
    {
      action: updateReviewCampaign,
      success: "Review campaign updated successfully",
      error: "Review campaign update failed",
    },
    {
      action: deleteReviewCampaign,
      success: "Review campaign deleted successfully",
      error: "Review campaign deletion failed",
    },
    {
      action: inviteReviewCampaignMembers,
      success: "Invitations sent",
      error: "Failed to send invitations",
    },
    {
      action: revokeReviewCampaignMembership,
      success: "Membership revoked",
      error: "Failed to revoke membership",
    },
  ]

  for (const { action, success, error } of notifications) {
    listenerMiddleware.startListening({
      actionCreator: action.fulfilled,
      effect: async (_, listenerApi) => {
        listenerApi.dispatch(notificationsActions.show({ title: success, type: "success" }))
      },
    })
    listenerMiddleware.startListening({
      actionCreator: action.rejected,
      effect: async (_, listenerApi) => {
        listenerApi.dispatch(notificationsActions.show({ title: error, type: "error" }))
      },
    })
  }
}

export const reviewCampaignsMiddleware = { listenerMiddleware, registerListeners }
