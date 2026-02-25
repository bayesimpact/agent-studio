import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { MessagesSquareIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { selectCurrentAgentSessionsDataFromAgentId } from "@/features/agent-sessions/agent-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { AgentSessionCreator } from "../../agent-session/AgentSessionCreator"
import { NavFeedback } from "../nav/NavFeedback"
import type { MenuItem } from "../types"

export function AgentSessionList({
  organizationId,
  agentId,
  projectId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) {
  const { agentSessionId: urlagentSessionId } = useParams()
  const { buildPath } = useBuildPath()

  const sessions = useAppSelector(selectCurrentAgentSessionsDataFromAgentId(agentId))

  const items: MenuItem[] = ADS.isFulfilled(sessions)
    ? sessions.value.map((session) => ({
        id: session.id,
        title: buildDate(session.createdAt),
        url: buildPath("agentSession", {
          organizationId,
          projectId,
          agentId,
          agentSessionId: session.id,
        }),
        isActive: urlagentSessionId === session.id,
        icon: MessagesSquareIcon,
      }))
    : []
  return (
    <SidebarMenuSub>
      {items.length > 0 && (
        <AgentSessionCreator
          organizationId={organizationId}
          projectId={projectId}
          agentId={agentId}
          type="menu"
        />
      )}

      {items.map((item) => (
        <SidebarMenuSubItem key={item.id}>
          <SidebarMenuSubButton asChild isActive={item.isActive}>
            <Link to={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {/* // TODO: dropdown with delete option */}
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}

      <NavFeedback organizationId={organizationId} projectId={projectId} agentId={agentId} />
    </SidebarMenuSub>
  )
}
