import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { MessagesSquareIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { ConversationAgentSessionCreator } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionCreator"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionsDataFromAgentId } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { selectCurrentAgentSessionId } from "@/features/agents/current-agent-session-id/current-agent-session-id.selectors"
import { FormAgentSessionCreator } from "@/features/agents/form-agent-sessions/components/FormAgentSessionCreator"
import { selectCurrentFormAgentSessionsDataFromAgentId } from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { NavFeedback } from "../nav/NavFeedback"
import type { MenuItem } from "../types"

type Ids = {
  organizationId: string
  projectId: string
  agentId: string
}
export function SidebarAgentSessionList({ ids, agentType }: { ids: Ids; agentType: string }) {
  switch (agentType) {
    case "conversation":
      return <ConversationAgentSessionList {...ids} />
    case "form":
      return <FormAgentSessionList {...ids} />
    default:
      return null
  }
}

function FormAgentSessionList(props: Ids) {
  const sessionsData = useAppSelector(selectCurrentFormAgentSessionsDataFromAgentId(props.agentId))
  if (!ADS.isFulfilled(sessionsData)) return null

  return (
    <SessionList sessions={sessionsData.value} ids={props}>
      <FormAgentSessionCreator ids={props} type="menu" />
    </SessionList>
  )
}

function ConversationAgentSessionList(props: Ids) {
  const sessionsData = useAppSelector(
    selectCurrentConversationAgentSessionsDataFromAgentId(props.agentId),
  )
  if (!ADS.isFulfilled(sessionsData)) return null

  return (
    <SessionList sessions={sessionsData.value} ids={props}>
      <ConversationAgentSessionCreator ids={props} type="menu" />
    </SessionList>
  )
}

function SessionList({
  sessions,
  ids,
  children,
}: {
  sessions: ConversationAgentSession[]
  ids: Ids
  children?: React.ReactNode
}) {
  const currentSessionId = useAppSelector(selectCurrentAgentSessionId)
  const { buildPath } = useBuildPath()
  const items: MenuItem[] = sessions.map((session) => ({
    id: session.id,
    title: buildDate(session.createdAt),
    url: buildPath("agentSession", { ...ids, agentSessionId: session.id }),
    isActive: currentSessionId === session.id,
    icon: MessagesSquareIcon,
  }))

  return (
    <SidebarMenuSub>
      {children}

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

      <NavFeedback
        organizationId={ids.organizationId}
        projectId={ids.projectId}
        agentId={ids.agentId}
      />
    </SidebarMenuSub>
  )
}
