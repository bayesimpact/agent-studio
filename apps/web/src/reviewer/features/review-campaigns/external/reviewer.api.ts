import { ReviewCampaignsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IReviewerSpi } from "../reviewer.spi"

const reviewerApi = {
  listMyCampaigns: async () => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ReviewCampaignsRoutes.getMyReviewCampaigns.response>(
      ReviewCampaignsRoutes.getMyReviewCampaigns.getPath(),
      { params: { role: "reviewer" } },
    )
    return response.data.data.reviewCampaigns
  },

  listSessions: async ({ organizationId, projectId, reviewCampaignId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ReviewCampaignsRoutes.listReviewerSessions.response>(
      ReviewCampaignsRoutes.listReviewerSessions.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
      }),
    )
    return response.data.data.sessions
  },

  getSession: async ({ organizationId, projectId, reviewCampaignId, sessionId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ReviewCampaignsRoutes.getReviewerSession.response>(
      ReviewCampaignsRoutes.getReviewerSession.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
        sessionId,
      }),
    )
    return response.data.data
  },

  submitReview: async ({ organizationId, projectId, reviewCampaignId, sessionId }, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof ReviewCampaignsRoutes.submitReviewerSessionReview.response
    >(
      ReviewCampaignsRoutes.submitReviewerSessionReview.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
        sessionId,
      }),
      { payload },
    )
    return response.data.data
  },

  updateReview: async (
    { organizationId, projectId, reviewCampaignId, sessionId, reviewId },
    payload,
  ) => {
    const axios = getAxiosInstance()
    const response = await axios.patch<
      typeof ReviewCampaignsRoutes.updateReviewerSessionReview.response
    >(
      ReviewCampaignsRoutes.updateReviewerSessionReview.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
        sessionId,
        reviewId,
      }),
      { payload },
    )
    return response.data.data
  },
} satisfies IReviewerSpi

export default reviewerApi
