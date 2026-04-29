"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { ClipboardCheckIcon, PlusIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import type { Agent } from "@/common/features/agents/agents.models"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppSelector } from "@/common/store/hooks"
import type { ReviewCampaignListItem } from "../review-campaigns.models"
import { selectReviewCampaignsData } from "../review-campaigns.selectors"
import { CampaignEditorSheet } from "./CampaignEditorSheet"
import { CampaignListTable } from "./CampaignListTable"

type EditorState =
  | { mode: "create"; campaignId?: undefined }
  | { mode: "edit"; campaignId: string }
  | null

export function CampaignListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const campaigns = useAppSelector(selectReviewCampaignsData)
  const agents = useAppSelector(selectAgentsData)
  const [editor, setEditor] = useState<EditorState>(null)
  const handleBack = () => {
    navigate(-1)
  }
  return (
    <div className="flex flex-col bg-white">
      <GridHeader
        onBack={handleBack}
        title={t("reviewCampaigns:title")}
        description={t("reviewCampaigns:subtitle")}
        action={
          <Button onClick={() => setEditor({ mode: "create" })}>
            <PlusIcon /> {t("reviewCampaigns:new")}
          </Button>
        }
      />

      <div className="p-6">
        <AsyncRoute data={[campaigns, agents]}>
          {([campaignsValue, agentsValue]) => (
            <WithData
              campaigns={campaignsValue}
              agents={agentsValue}
              editor={editor}
              setEditor={setEditor}
            />
          )}
        </AsyncRoute>
      </div>
    </div>
  )
}

function WithData({
  campaigns,
  agents,
  editor,
  setEditor,
}: {
  campaigns: ReviewCampaignListItem[]
  agents: Agent[]
  editor: EditorState
  setEditor: React.Dispatch<React.SetStateAction<EditorState>>
}) {
  // Review campaigns only support conversation + form agents as targets;
  // testerService.startSession rejects extraction agents (apps/api/.../tester.service.ts).
  const agentOptions = useMemo(() => {
    return agents
      .filter((agent) => agent.type === "conversation" || agent.type === "form")
      .map((agent) => ({ id: agent.id, name: agent.name }))
  }, [agents])

  const membershipCountByCampaign = Object.fromEntries(
    campaigns.map((campaign) => [campaign.id, campaign.memberCount]),
  )

  return (
    <>
      {campaigns.length === 0 ? (
        <EmptyCampaigns />
      ) : (
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
    </>
  )
}

function EmptyCampaigns() {
  const { t } = useTranslation()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardCheckIcon />
        </EmptyMedia>
        <EmptyTitle>{t("reviewCampaigns:empty.title")}</EmptyTitle>
        <EmptyDescription>{t("reviewCampaigns:empty.description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
