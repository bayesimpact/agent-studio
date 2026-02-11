import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { format } from "date-fns"
import { MessagesSquareIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { selectAgentSessionsFromAgentId } from "@/features/agent-sessions/agent-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { getLocale } from "@/utils/get-locale"
import { NavFeedback } from "../../feedback/NavFeedback"
import type { MenuItem } from "../../types"
import { CreateAgentSession } from "./CreateAgentSession"

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

  const sessions = useAppSelector(selectAgentSessionsFromAgentId(agentId))

  const items: MenuItem[] = ADS.isFulfilled(sessions)
    ? sessions.value.map((session) => ({
        id: session.id,
        title: format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", {
          locale: getLocale(),
        }),
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
        <CreateAgentSession
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
