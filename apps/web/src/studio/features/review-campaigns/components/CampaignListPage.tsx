"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { PlusIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { selectReviewCampaignsData } from "../review-campaigns.selectors"
import { listReviewCampaigns } from "../review-campaigns.thunks"
import { CampaignEditorSheet } from "./CampaignEditorSheet"
import { CampaignListTable } from "./CampaignListTable"

type EditorState =
  | { mode: "create"; campaignId?: undefined }
  | { mode: "edit"; campaignId: string }
  | null

export function CampaignListPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const campaignsData = useAppSelector(selectReviewCampaignsData)
  const agentsData = useAppSelector(selectAgentsData)
  const [editor, setEditor] = useState<EditorState>(null)

  useEffect(() => {
    dispatch(listReviewCampaigns())
  }, [dispatch])

  // Review campaigns only support conversation + form agents as targets;
  // testerService.startSession rejects extraction agents (apps/api/.../tester.service.ts).
  const agentOptions = useMemo(() => {
    if (!ADS.isFulfilled(agentsData)) return []
    return agentsData.value
      .filter((agent) => agent.type === "conversation" || agent.type === "form")
      .map((agent) => ({ id: agent.id, name: agent.name }))
  }, [agentsData])

  const campaigns = ADS.isFulfilled(campaignsData) ? campaignsData.value : []
  const membershipCountByCampaign = Object.fromEntries(
    campaigns.map((campaign) => [campaign.id, campaign.memberCount]),
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t("reviewCampaigns:title")}</h1>
          <p className="text-muted-foreground text-sm">{t("reviewCampaigns:subtitle")}</p>
        </div>
        <Button onClick={() => setEditor({ mode: "create" })}>
          <PlusIcon /> {t("reviewCampaigns:new")}
        </Button>
      </header>

      {ADS.isLoading(campaignsData) && (
        <p className="text-muted-foreground text-sm">{t("reviewCampaigns:loading")}</p>
      )}
      {ADS.isError(campaignsData) && (
        <p className="text-destructive text-sm">{campaignsData.error}</p>
      )}
      {(ADS.isFulfilled(campaignsData) || campaigns.length > 0) && (
        <CampaignListTable
          campaigns={campaigns}
          membershipCountByCampaign={membershipCountByCampaign}
          onEdit={(campaignId) => setEditor({ mode: "edit", campaignId })}
          onDelete={(campaignId) => setEditor({ mode: "edit", campaignId })}
          onCreate={() => setEditor({ mode: "create" })}
        />
      )}

      {editor && (
        <CampaignEditorSheet
          open
          mode={editor.mode}
          reviewCampaignId={editor.mode === "edit" ? editor.campaignId : undefined}
          agents={agentOptions}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}
