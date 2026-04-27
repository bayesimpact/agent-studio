"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { ArrowLeftIcon, DownloadIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { getServices } from "@/di/services"
import { selectCampaignReport } from "../reports.selectors"
import { getCampaignReport } from "../reports.thunks"
import { CampaignReport } from "./CampaignReport"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

type Props = {
  /** Path to navigate back to when the user clicks "Back". */
  backPath: string
  /** Label for the back button. */
  backLabel?: string
}

export function CampaignReportPage({ backPath, backLabel = "Back" }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const params = useParams<Params>()
  const reportState = useAppSelector(selectCampaignReport(params.reviewCampaignId ?? ""))
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    dispatch(
      getCampaignReport({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
      }),
    )
  }, [dispatch, params.organizationId, params.projectId, params.reviewCampaignId])

  if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return null
  const { organizationId, projectId, reviewCampaignId } = params

  const handleDownloadCsv = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const blob = await getServices().reviewCampaignsReports.getReportCsv({
        organizationId,
        projectId,
        reviewCampaignId,
      })
      const url = URL.createObjectURL(blob)
      const linkElement = document.createElement("a")
      linkElement.href = url
      linkElement.download = `campaign-report-${reviewCampaignId}.csv`
      linkElement.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
          <ArrowLeftIcon /> {backLabel}
        </Button>
        <h1 className="text-2xl font-semibold">Campaign report</h1>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={isDownloading || !ADS.isFulfilled(reportState)}
          >
            <DownloadIcon /> {isDownloading ? "Downloading…" : "Download CSV"}
          </Button>
        </div>
      </header>

      {ADS.isLoading(reportState) && (
        <p className="text-muted-foreground text-sm">Loading report…</p>
      )}
      {ADS.isError(reportState) && <p className="text-destructive text-sm">{reportState.error}</p>}
      {ADS.isFulfilled(reportState) && <CampaignReport report={reportState.value} />}
    </div>
  )
}
