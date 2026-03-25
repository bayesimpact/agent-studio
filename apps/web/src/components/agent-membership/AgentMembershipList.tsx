import type { AgentMembership } from "@/features/agent-memberships/agent-memberships.models"
import { AgentMembershipItem } from "./AgentMembershipItem"
import { EmptyAgentMembership } from "./EmptyAgentMembership"

export function AgentMembershipList({ memberships }: { memberships: AgentMembership[] }) {
  if (memberships.length === 0) return <EmptyAgentMembership />
  return (
    // FIXME: use a Table instead of a list
    <div className="flex flex-col gap-4">
      {memberships.map((membership) => (
        <AgentMembershipItem key={membership.id} membership={membership} />
      ))}
    </div>
  )
}
