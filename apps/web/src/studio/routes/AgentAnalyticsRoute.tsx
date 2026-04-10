import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import type { Agent } from "@/common/features/agents/agents.models"
import {
  selectCurrentAgentData,
  selectCurrentAgentId,
} from "@/common/features/agents/agents.selectors"
import { getAgentIcon } from "@/common/features/agents/components/AgentIcon"
import { useGetPath } from "@/common/hooks/use-build-path"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "../../common/routes/AsyncRoute"
import { ErrorRoute } from "../../common/routes/ErrorRoute"

export function AgentAnalyticsRoute() {
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectCurrentAgentData)

  if (!agentId) return <ErrorRoute error="Missing valid agent ID" />

  return <AsyncRoute data={[agent]}>{([agentValue]) => <WithData agent={agentValue} />}</AsyncRoute>
}

function WithData({ agent }: { agent: Agent }) {
  const { t } = useTranslation("agentAnalytics")
  const navigate = useNavigate()
  const { getPath } = useGetPath()

  const handleBack = () => {
    const path = getPath("agent")
    navigate(path)
  }

  const Icon = getAgentIcon(agent.type)
  return (
    <>
      <GridHeader
        onBack={handleBack}
        title={t("list.pageTitle")}
        description={
          <>
            <div className="capitalize-first">{agent.name}</div> •
            <div className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</div>
            <Icon />
          </>
        }
      />
      <div className="px-6 py-8 text-muted-foreground bg-white">{t("list.placeholder")}</div>
    </>
  )
}
