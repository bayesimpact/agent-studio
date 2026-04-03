import { useEffect } from "react"
import { AgentMembershipList } from "@/components/agent-membership/AgentMembershipList"
import { MembersCreator } from "@/components/agent-membership/MembersCreator"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { AgentMembership } from "@/features/agent-memberships/agent-memberships.models"
import { selectAgentMemberships } from "@/features/agent-memberships/agent-memberships.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../../routes/AsyncRoute"

export function AgentMembershipsRoute() {
  const memberships = useAppSelector(selectAgentMemberships)

  return (
    <AsyncRoute data={[memberships]}>
      {([membershipsValue]) => <WithData memberships={membershipsValue} />}
    </AsyncRoute>
  )
}

function WithData({ memberships }: { memberships: AgentMembership[] }) {
  useHandleHeader()
  return (
    <div className="p-6">
      <AgentMembershipList memberships={memberships} />
    </div>
  )
}

function useHandleHeader() {
  const { setHeaderRightSlot } = useSidebarLayout()
  useEffect(() => {
    setHeaderRightSlot(<MembersCreator />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot])
}
