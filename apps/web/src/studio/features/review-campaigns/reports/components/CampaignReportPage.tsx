"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { DownloadIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { getServices } from "@/di/services"
import type { CampaignReport as CampaignReportType } from "../reports.models"
import { selectCampaignReport } from "../reports.selectors"
import { reviewCampaignsReportsActions } from "../reports.slice"
import { CampaignReport } from "./CampaignReport"

type Props = {
  backPath: string
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

export function CampaignReportPage({
  backPath,
  organizationId,
  projectId,
  reviewCampaignId,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const report = useAppSelector(selectCampaignReport(reviewCampaignId))

  useMount({
    actions: reviewCampaignsReportsActions,
    condition: !!reviewCampaignId,
  })

  const handleBack = () => {
    navigate(backPath)
  }
  return (
    <>
      <GridHeader
        onBack={handleBack}
        title={t("reviewCampaigns:report.title")}
        action={
          ADS.isFulfilled(report) && (
            <DownloadCsvButton
              organizationId={organizationId}
              projectId={projectId}
              reviewCampaignId={reviewCampaignId}
            />
          )
        }
      />

      <div className="flex flex-col gap-6 p-6">
        <AsyncRoute data={[report]}>
          {([reportValue]) => <WithData report={reportValue} />}
        </AsyncRoute>
      </div>
    </>
  )
}

function WithData({ report }: { report: CampaignReportType }) {
  return <CampaignReport report={report} />
}

function DownloadCsvButton({
  reviewCampaignId,
  organizationId,
  projectId,
}: {
  reviewCampaignId: string
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)

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
    <Button variant="outline" size="sm" onClick={handleDownloadCsv} disabled={isDownloading}>
      <DownloadIcon />{" "}
      {isDownloading
        ? t("reviewCampaigns:report.downloading")
        : t("reviewCampaigns:report.downloadCsv")}
    </Button>
  )
}
