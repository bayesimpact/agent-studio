import { ReviewCampaignsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IReportsSpi } from "../reports.spi"

const reportsApi = {
  getReport: async ({ organizationId, projectId, reviewCampaignId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ReviewCampaignsRoutes.getCampaignReport.response>(
      ReviewCampaignsRoutes.getCampaignReport.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
      }),
    )
    return response.data.data
  },

  getReportCsv: async ({ organizationId, projectId, reviewCampaignId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<Blob>(
      ReviewCampaignsRoutes.getCampaignReportCsv.getPath({
        organizationId,
        projectId,
        reviewCampaignId,
      }),
      { responseType: "blob" },
    )
    return response.data
  },
} satisfies IReportsSpi

export default reportsApi
