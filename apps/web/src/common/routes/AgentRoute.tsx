import type { Agent } from "@/common/features/agents/agents.models"
import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "./AsyncRoute"

export function AgentRoute({ children }: { children: (agent: Agent) => React.ReactNode }) {
  const agent = useAppSelector(selectCurrentAgentData)
  return <AsyncRoute data={[agent]}>{([agentValue]) => children(agentValue)}</AsyncRoute>
}
