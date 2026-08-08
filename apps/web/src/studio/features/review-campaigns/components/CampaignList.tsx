import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { ClipboardCheckIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { selectPublishedAgentSettingsByAgentId } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { useValue } from "@/common/hooks/use-value"
import { useAppSelector } from "@/common/store/hooks"
import type { EditorState } from "@/studio/routes/CampaignsRoute"
import { selectReviewCampaignsData } from "../review-campaigns.selectors"
import { CampaignEditorSheet } from "./CampaignEditorSheet"
import { CampaignListTable } from "./CampaignListTable"

export function CampaignList({
  editor,
  setEditor,
}: {
  editor: EditorState
  setEditor: React.Dispatch<React.SetStateAction<EditorState>>
}) {
  const agents = useValue(selectAgentsData)
  const campaigns = useValue(selectReviewCampaignsData)
  const versionsByAgentId = useAppSelector(selectPublishedAgentSettingsByAgentId)
  // Review campaigns only support conversation agents as targets;
  // testerService.startSession rejects extraction agents (apps/api/.../tester.service.ts).
  const agentOptions = useMemo(() => {
    return agents
      .filter((agent) => agent.type === "conversation")
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        versions: (versionsByAgentId[agent.id] ?? []).map((settings) => ({
          revision: settings.revision,
          name: settings.name,
          updatedAt: settings.updatedAt,
        })),
      }))
  }, [agents, versionsByAgentId])

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
