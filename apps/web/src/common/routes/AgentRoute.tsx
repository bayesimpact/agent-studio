import type { Agent } from "@/common/features/agents/agents.models"
import {
  selectCurrentAgentData,
  selectCurrentAgentId,
} from "@/common/features/agents/agents.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "./AsyncRoute"
import { LoadingRoute } from "./LoadingRoute"

export function AgentRoute({ children }: { children: (agent: Agent) => React.ReactNode }) {
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectCurrentAgentData)
  if (!agentId) return <LoadingRoute />
  return <AsyncRoute data={[agent]}>{([agentValue]) => children(agentValue)}</AsyncRoute>
}
