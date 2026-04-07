import { useAppSelector } from "@/common/store/hooks"
import type { Agent } from "@/features/agents/agents.models"
import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import { AsyncRoute } from "./AsyncRoute"

export function AgentRoute({ children }: { children: (agent: Agent) => React.ReactNode }) {
  const agent = useAppSelector(selectCurrentAgentData)
  return <AsyncRoute data={[agent]}>{([agentValue]) => children(agentValue)}</AsyncRoute>
}
