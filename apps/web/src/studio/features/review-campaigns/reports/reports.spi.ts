import type { CampaignReport } from "./reports.models"

type CampaignScope = { organizationId: string; projectId: string; reviewCampaignId: string }

export interface IReportsSpi {
  getReport(params: CampaignScope): Promise<CampaignReport>
  getReportCsv(params: CampaignScope): Promise<Blob>
}
