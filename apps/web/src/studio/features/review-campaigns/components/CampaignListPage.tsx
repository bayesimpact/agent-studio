"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { PlusIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
  const dispatch = useAppDispatch()
  const campaignsData = useAppSelector(selectReviewCampaignsData)
  const agentsData = useAppSelector(selectAgentsData)
  const [editor, setEditor] = useState<EditorState>(null)

  useEffect(() => {
    dispatch(listReviewCampaigns())
  }, [dispatch])

  const agentOptions = useMemo(() => {
    if (!ADS.isFulfilled(agentsData)) return []
    return agentsData.value.map((agent) => ({ id: agent.id, name: agent.name }))
  }, [agentsData])

  const campaigns = ADS.isFulfilled(campaignsData) ? campaignsData.value : []

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Review campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Evaluate agents with invited testers and reviewers.
          </p>
        </div>
        <Button onClick={() => setEditor({ mode: "create" })}>
          <PlusIcon /> New campaign
        </Button>
      </header>

      {ADS.isLoading(campaignsData) && <p className="text-muted-foreground text-sm">Loading…</p>}
      {ADS.isError(campaignsData) && (
        <p className="text-destructive text-sm">{campaignsData.error}</p>
      )}
      {(ADS.isFulfilled(campaignsData) || campaigns.length > 0) && (
        <CampaignListTable
          campaigns={campaigns}
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
